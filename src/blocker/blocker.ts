import { Container, Service } from "typedi";
import { Settings } from "../settings";
import { Modal } from "../modal";
import { WINDOW_TOKEN } from "../window-token";
import { Clock } from "../clock";
import template from "./blocker.pug";
import "./blocker.scss";

export type BlockReason = "schedule" | "limit" | "breakEnd";

@Service()
export class Blocker {
	public readonly prefix = `${HTML_PREFIX}__blocker`;

	private set timerId(value: number | null) {
		if (this._timerId) {
			clearTimeout(this._timerId);
		}

		this._timerId = value;
	}

	private _timerId: number | null = null;

	constructor(
		container: Container,
		private window = Container.get(WINDOW_TOKEN),
		private clock = Container.get(Clock),
		private settings = Container.get(Settings),
		private modal = Container.get(Modal)
	) {
		this.handleBlockOrDelay();
		this.settings.onSettingsChange(() => this.reset());
	}

	public reset() {
		if (this._timerId) {
			clearTimeout(this._timerId);
		}
		this.handleBlockOrDelay();
	}

	private handleBlockOrDelay() {
		const blockData = this.getBlockData();
		if (!blockData) {
			return;
		}

		if (blockData.remain <= 0) {
			this.handleBlock(blockData.reason);
		} else {
			this.timerId = this.window.setTimeout(
				() => this.handleBlockOrDelay(),
				blockData.remain
			);
		}
	}

	private getBlockData(): { remain: number; reason: BlockReason } | null {
		let timeToBlock: { remain: number; reason: BlockReason } | null = null;

		const dailyLimit = this.settings.getSetting("dailyLimit");
		if (dailyLimit !== null) {
			timeToBlock = {
				remain: Math.max(0, dailyLimit * 3.6e6 - this.clock.getTimeSpent()),
				reason: "limit",
			};
		}

		const dayOfTheWeek = (new Date().getDay() + 6) % 7; // mon..sun = 0..6

		if (this.settings.getSetting("days").includes(dayOfTheWeek)) {
			const todayDateString = new Date().toISOString().slice(0, 10);

			const scheduleBlockStart = this.settings.getSetting("startTime");
			const scheduleBlockEnd = this.settings.getSetting("endTime");

			const blockTimeStart = Date.parse(
				`${todayDateString}T${scheduleBlockStart}`
			);
			const blockTimeStop = Date.parse(
				`${todayDateString}T${scheduleBlockEnd}`
			);

			const timeToScheduleBlock = blockTimeStart - Date.now();
			const timeToScheduleUnlock = blockTimeStop - Date.now();
			if (timeToScheduleBlock < 0 && timeToScheduleUnlock > 0) {
				return { remain: 0, reason: "schedule" };
			}
			if (timeToScheduleBlock > 0) {
				if (!timeToBlock || timeToScheduleBlock < timeToBlock?.remain) {
					return {
						reason: "schedule",
						remain: timeToScheduleBlock,
					};
				}
				return timeToBlock;
			}
		}

		return timeToBlock;
	}

	private handleBlock(reason: BlockReason) {
		this.clock.stop();
		const breakTimeLeft = Math.max(
			0,
			(this.settings.getSetting("breakDuration") ?? 0) * 60 * 1000 -
				this.clock.getBreakTimeSpent()
		);

		if (
			reason === "schedule" &&
			this.settings.getSetting("breakAllowed") &&
			breakTimeLeft > 0
		) {
			this.modal
				.show({
					title: "Block",
					content: `You seem to visit the ${
						this.window.location.hostname
					} in restricted time, but you can take a break (${(
						breakTimeLeft /
						60 /
						1000
					).toFixed(1)} minutes have left)`,
					okButton: "Take a break",
					closeButton: "Block",
				})
				.then((ok) => {
					if (!ok) {
						this.block(reason);
						return;
					}

					this.clock.startBreakPeriod();
					this.timerId = this.window.setTimeout(() => {
						const blockData = this.getBlockData();
						if (blockData) {
							this.handleBlock("breakEnd");
						}
					}, breakTimeLeft);
				});
			return;
		} else {
			this.block(reason);
			this.modal.show({
				title: "Block",
				content: `The ${this.window.location.hostname} was blocked. Reason: ${reason}`,
			});
			return;
		}
	}

	private block(reason: BlockReason) {
		this.clock.stop();
		const wrapper = this.window.document.createElement("div");
		let unlockTime = null;
		if (reason === "limit") {
			unlockTime = "tomorrow";
		} else {
			unlockTime = this.settings.getSetting("endTime");
		}
		wrapper.innerHTML = template({
			...this,
			spentTime: this.clock.getTimeSpent(),
			reason,
			unlockTime,
		});
		this.bindInteractions(wrapper);

		const videoElement: HTMLVideoElement | null = this.window.document
			.getElementsByTagName("video")
			.item(0);
		if (videoElement) {
			videoElement.pause();
			videoElement.removeAttribute("src");
			videoElement.load();
		}

		this.window.document.body.innerHTML = "";
		this.window.document.body.appendChild(wrapper.firstElementChild!);
	}

	private bindInteractions(element: HTMLDivElement) {
		element
			.querySelector('[data-action="settings"]')!
			.addEventListener("click", () => this.settings.showSettingsDialog());
	}
}

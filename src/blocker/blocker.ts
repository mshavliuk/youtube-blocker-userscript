import { Container, Service } from "typedi";
import { Settings } from "../settings";
import { Modal } from "../modal";
import { WINDOW_TOKEN } from "../window-token";
import { Clock } from "../clock";

export type BlockReason = "schedule" | "limit" | "breakEnd";

@Service()
export class Blocker {
	constructor(
		container: Container,
		private window = Container.get(WINDOW_TOKEN),
		private clock = Container.get(Clock),
		private settings = Container.get(Settings),
		private modal = Container.get(Modal)
	) {}

	public start() {
		const timeToBlock = this.getBlockData();
		if (timeToBlock !== null) {
			setTimeout(
				() => this.handleBlock(timeToBlock.reason),
				timeToBlock.remain
			);
		}
	}

	private getBlockData(): { remain: number; reason: BlockReason } | null {
		let timeToBlock: { remain: number; reason: BlockReason } | null = null;

		const dailyLimit = this.settings.getSetting("dailyLimit");
		if (dailyLimit !== null) {
			timeToBlock = {
				remain: Math.max(0, dailyLimit * 3600 - this.clock.getTimeSpent()),
				reason: "limit",
			};
		}

		const dayOfTheWeek = (new Date().getDay() + 6) % 7; // mon..sun = 0..6

		if (this.settings.getSetting("days").includes(dayOfTheWeek)) {
			const todayDateString = new Date().toISOString().slice(0, 10);

			const scheduleBlockStart = this.settings.getSetting("startTime");
			const scheduleBlockEnd = this.settings.getSetting("endTime");
			// TODO: time to unlock
			// TODO: take the following day into account

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
					if (ok) {
						this.clock.startBreakPeriod();
						setTimeout(() => {
							const blockData = this.getBlockData();
							if (blockData) {
								this.handleBlock("breakEnd");
							}
						}, breakTimeLeft);
					} else {
						this.block();
					}
				});
			return;
		} else {
			this.block();
			this.modal.attach();
			this.modal.show({
				title: "Block",
				content: `The ${this.window.location.hostname} was blocked. Reason: ${reason}`,
			});
			return;
		}
	}

	private block() {
		this.clock.stop();
		this.window.document.body.innerHTML = "";
	}
}

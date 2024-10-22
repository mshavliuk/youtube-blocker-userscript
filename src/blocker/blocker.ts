import { Container, Service } from "typedi";
import { Settings } from "../settings";
import { Modal } from "../modal";
import { WINDOW_TOKEN } from "../window-token";
import { Clock } from "../clock";
import pageTemplate from "./blocker-page.pug";
import breakTemplate from "./blocker-break-modal.pug";
import "./blocker-page.scss";
import "./blocker-break-modal.scss";

export type BlockReason = "schedule" | "limit" | "breakEnd";

export type BlockerStore = {
	break: {
		value: boolean;
		expire: string;
	};
};

@Service()
export class Blocker {
	public readonly prefix = `${HTML_PREFIX}__blocker`;
	private readonly STORE_KEY = `${STORE_PREFIX} Blocker`;

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
		const breakState = this.getBreakState();

		if (reason === "schedule" && breakState) {
			this.block(reason);
		} else if (
			reason === "schedule" &&
			this.settings.getSetting("breakAllowed") &&
			breakTimeLeft > 0
		) {
			if (breakState === false) {
				this.breakStart(breakTimeLeft);
				return;
			}
			const templateElement = this.window.document.createElement("div");
			templateElement.innerHTML = breakTemplate({
				...this,
				hostname: this.window.location.hostname,
				breakTimeLeft: breakTimeLeft / 60 / 1000,
			});
			this.modal
				.show({
					title: "Block",
					content: templateElement,
					okButton: "Take a break",
					closeButton: "Block",
				})
				.then((ok) => {
					const form = templateElement.querySelector(
						`#${this.prefix}-break-modal`
					) as HTMLFormElement;

					const formData = new FormData(form);
					if (formData.get("remember") === "on") {
						this.saveState({
							break: {
								value: !ok,
								expire: new Date().toISOString().slice(0, 10),
							},
						});
					}

					if (!ok) {
						this.block(reason);
					} else {
						this.breakStart(breakTimeLeft);
					}
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

	private breakStart(breakTimeLeft: number) {
		this.clock.startBreakPeriod();
		this.timerId = this.window.setTimeout(() => {
			const blockData = this.getBlockData();
			if (blockData) {
				this.handleBlock("breakEnd");
			}
		}, breakTimeLeft);
	}

	private getBreakState() {
		const state = this.loadState();
		if (!state || state.break.expire < new Date().toISOString().slice(0, 10)) {
			return null;
		}

		return state.break.value;
	}

	private loadState(): BlockerStore | null {
		const strData = this.window.localStorage.getItem(this.STORE_KEY);
		if (strData === null) {
			return null;
		}
		return JSON.parse(strData);
	}

	private saveState(state: BlockerStore) {
		this.window.localStorage.setItem(this.STORE_KEY, JSON.stringify(state));
	}

	private block(reason: BlockReason) {
		this.clock.stop();
		const wrapper = this.window.document.createElement("div");
		let unlockTime;
		if (reason === "limit") {
			unlockTime = "tomorrow";
		} else {
			unlockTime = this.settings.getSetting("endTime");
		}
		wrapper.innerHTML = pageTemplate({
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

		this.window.document.head
			.querySelectorAll("script")
			.forEach((script) => script.remove());

		this.destroyYtLogic();
		this.cutNetwork();

		this.window.document.body.appendChild(wrapper.firstElementChild!);
	}

	private destroyYtLogic() {
		if (this.window.ytEventsEventsListeners) {
			Object.values(
				this.window.ytEventsEventsListeners
			).forEach(([target, event, callback]) =>
				target.removeEventListener(event, callback)
			);
		}
		for (const prop of Object.keys(this.window)) {
			if (prop.startsWith("yt") && this.window.hasOwnProperty(prop)) {
				try {
					delete this.window[prop as keyof Window];
				} catch (e) {}
			}
		}
		const lastIntervalId = this.window.setInterval(this.noop, -1);
		for (let i = 1; i < lastIntervalId; i++) {
			this.window.clearInterval(i);
		}
		const lastTimeoutId = this.window.setTimeout(this.noop, -1);
		for (let i = 1; i < lastTimeoutId; i++) {
			this.window.clearTimeout(i);
		}
	}

	private cutNetwork() {
		try {
			XMLHttpRequest.prototype.send = this.noop;
			this.window.navigator.sendBeacon = () => false;
		} catch (e) {}
	}

	private bindInteractions(element: HTMLDivElement) {
		const readOnlySettings = this.settings.getSetting("readonlyWhenBlocked");
		element
			.querySelector('[data-action="settings"]')!
			.addEventListener("click", () =>
				this.settings.showSettingsDialog(readOnlySettings)
			);
	}

	private noop() {
		return undefined;
	}
}

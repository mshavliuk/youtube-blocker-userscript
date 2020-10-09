import { Inject, Service } from "typedi";
import { Settings } from "../settings";
import { Modal } from "../modal";
import { WINDOW_TOKEN } from "../window-token";
import { Clock } from "../clock";

export type BlockReason = "schedule" | "limit";

@Service()
export class Blocker {
	constructor(
		@Inject(WINDOW_TOKEN) private window: Window,
		private clock: Clock,
		private settings: Settings,
		private modal: Modal
	) {}

	public start() {
		const timeToBlock = this.getTimeToBlock();
		if (timeToBlock !== null) {
			setTimeout(() => this.block(timeToBlock.reason), timeToBlock.remain);
		}
	}

	private getTimeToBlock(): { remain: number; reason: BlockReason } | null {
		const settingsData = this.settings.getSettings();

		if (settingsData === null) {
			return null;
		}

		let timeToBlock: { remain: number; reason: BlockReason } | null = null;

		if (settingsData.dailyLimit) {
			timeToBlock = {
				remain:
					Math.max(
						0,
						settingsData.dailyLimit * 3600 - this.clock.getSpentTime()
					) * 1000,
				reason: "limit",
			};
		}

		const todayDateString = new Date().toISOString().slice(0, 10);

		const scheduleBlockStart = settingsData.startTime;
		const scheduleBlockEnd = settingsData.endTime;

		const dayOfTheWeek = (new Date().getDay() + 6) % 7; // mon..sun = 0..6

		if (settingsData.days.includes(dayOfTheWeek)) {
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
			} else if (timeToScheduleBlock > 0) {
				if (!timeToBlock || timeToScheduleBlock < timeToBlock?.remain) {
					return {
						reason: "schedule",
						remain: timeToScheduleBlock,
					};
				} else {
					return timeToBlock;
				}
			}
		}

		return timeToBlock;
	}

	private block(reason: BlockReason) {
		this.window.document.body.innerHTML = "";
		this.modal.attach();
		this.modal.show(
			"Let's get a grip!",
			`You seem to visit this site in restricted time. Reason: ${reason}`
		);
	}
}

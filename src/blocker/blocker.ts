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
		let timeToBlock: { remain: number; reason: BlockReason } | null = null;

		const dailyLimit = this.settings.getSetting("dailyLimit");
		if (dailyLimit !== null) {
			timeToBlock = {
				remain:
					Math.max(0, dailyLimit * 3600 - this.clock.getSpentTime()) * 1000,
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

	private block(reason: BlockReason) {
		this.modal.attach();
		// TODO: add button for lunch time
		// TODO: store the lunch taken
		if (this.isBreakAllowed()) {
			this.modal.show({
				title: "Let's get a grip!",
				content:
					"You seem to visit this site in restricted time, but you still can take a break",
			});
		} else {
			this.window.document.body.innerHTML = "";
			this.modal.show({
				title: "Let's get a grip!",
				content: `You seem to visit this site in restricted time. Reason: ${reason}`,
			});
		}
	}

	private isBreakAllowed(): boolean {
		return this.settings.getSetting("breakAllowed");
	}
}

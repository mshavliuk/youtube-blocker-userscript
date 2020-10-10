import { Inject, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";

export type ClockData = {
	timeSpent: number;
	breakTimeSpent: number;
};

@Service()
export class Clock {
	private readonly storeKey = `${STORE_PREFIX} Clock`;
	private readonly createdAt: Date;
	private readonly initialStoreData: Readonly<ClockData>;
	private breakStartedAt: Date | null = null;

	constructor(@Inject(WINDOW_TOKEN) private window: Window) {
		this.initialStoreData = this.loadState() ?? {
			breakTimeSpent: 0,
			timeSpent: 0,
		};
		this.createdAt = new Date();
	}

	// eslint-disable-next-line class-methods-use-this
	pause() {
		// TODO
		throw Error("not implemented");
	}

	// eslint-disable-next-line class-methods-use-this
	resume() {
		// TODO
		throw Error("not implemented");
	}

	public stop() {
		this.saveState();
	}

	public startBreakPeriod() {
		this.breakStartedAt = new Date();
	}

	public getTimeSpent() {
		return (
			this.initialStoreData.timeSpent + (Date.now() - this.createdAt.getTime())
		);
	}

	public getBreakTimeSpent(): number {
		if (this.breakStartedAt) {
			return (
				this.initialStoreData.breakTimeSpent +
				(Date.now() - this.breakStartedAt.getTime())
			);
		}
		return this.initialStoreData.breakTimeSpent;
	}

	// TODO: store break time is spent

	private saveState() {
		// TODO: store spent time for each day separately
		const dataToStore: ClockData = {
			timeSpent: this.getTimeSpent(),
			breakTimeSpent: this.getBreakTimeSpent(),
		};

		this.window.localStorage.setItem(
			this.storeKey,
			JSON.stringify(dataToStore)
		);
	}

	private loadState(): ClockData | null {
		const data = this.window.localStorage.getItem(this.storeKey);
		if (data === null) {
			return null;
		}

		return JSON.parse(data);
	}
}

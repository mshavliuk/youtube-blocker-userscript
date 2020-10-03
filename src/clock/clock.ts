import { Inject, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";

export type ClockData = {
	spentTime: number;
}

@Service()
export class Clock {
	private readonly storeKey = `${STORE_PREFIX} Clock`
	private readonly initialSpentTime: number;
	private readonly createdAt: number;

	constructor(@Inject(WINDOW_TOKEN) private window: Window) {
		const initialState = this.loadState();
		this.initialSpentTime = initialState?.spentTime ?? 0;
		this.createdAt = Date.now();
	}

	pause() {
		// TODO
		throw Error('not implemented');
	}

	resume() {
		// TODO
		throw Error('not implemented');
	}

	public stop() {
		this.saveState();
	}

	public getSpentTime() {
		return this.initialSpentTime + (Date.now() - this.createdAt) / 1000;
	}

	private saveState() {
		// TODO: store spent time for each day separately
		const dataToStore: ClockData = {
			spentTime: this.getSpentTime(),
		};

		this.window.localStorage.setItem(this.storeKey, JSON.stringify(dataToStore));
	}

	private loadState(): ClockData | null {
		const data = this.window.localStorage.getItem(this.storeKey);
		if (data === null) {
			return null;
		}

		return JSON.parse(data);
	}
}

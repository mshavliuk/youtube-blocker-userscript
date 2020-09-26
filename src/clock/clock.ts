import { Inject, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";

@Service()
export class Clock {
	private readonly initialSpentTime: number;
	private readonly createdAt: number;

	constructor(@Inject(WINDOW_TOKEN) private window: Window) {
		const initialState = this.loadState();
		if (initialState === null) {
			this.initialSpentTime = 0;
		} else {
			this.initialSpentTime = initialState.spentTime;
		}
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
		const dataToStore = {
			spentTime: this.getSpentTime(),
		};

		this.window.localStorage.setItem(
			`${STORE_PREFIX} State`,
			JSON.stringify(dataToStore)
		);
	}

	private loadState() {
		const data = this.window.localStorage.getItem(`${STORE_PREFIX} State`);
		if (data === null) {
			return null;
		}

		return JSON.parse(data);
	}
}

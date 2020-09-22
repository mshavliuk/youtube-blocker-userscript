export class Clock {
	constructor(window) {
		this.window = window;
		console.log("ClockWatch constructor");
		const initialState = this.loadState();
		if (initialState === null) {
			this.initialSpentTime = 0;
		} else {
			this.initialSpentTime = initialState.spentTime;
		}
		this.createAt = Date.now();
	}

	pause() {
		// TODO
	}

	resume() {
		// TODO
	}

	stop() {
		this.spentTime = this.getSpentTime();
		this.saveState();
	}

	getSpentTime() {
		return this.initialSpentTime + (Date.now() - this.createAt) / 1000;
	}

	saveState() {
		const dataToStore = {
			spentTime: this.spentTime,
		};

		this.window.localStorage.setItem(
			"[Youtube Blocker] State",
			JSON.stringify(dataToStore)
		);
	}

	loadState() {
		const data = this.window.localStorage.getItem("[Youtube Blocker] State");
		if (data === null) {
			return null;
		}

		return JSON.parse(data);
	}
}

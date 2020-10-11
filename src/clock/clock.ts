import { Container, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";
import * as visibility from "visibilityjs";

export type ClockData = {
	timeSpent: number;
	breakTimeSpent: number;
};

export type ClockStore = {
	[date: string]: ClockData;
};

@Service()
export class Clock {
	private static readonly STORE_KEY = `${STORE_PREFIX} Clock`;

	private clockStartedAt: Date | null = null;
	private breakStartedAt: Date | null = null;

	constructor(
		container: Container,
		private window = Container.get(WINDOW_TOKEN)
	) {
		visibility.change((event, state) => {
			if (state === "visible") {
				this.start();
			} else {
				this.stop();
			}
		});
		window.addEventListener("beforeunload", () => this.stop());
	}

	public start() {
		this.clockStartedAt = this.clockStartedAt ?? new Date();
	}

	public stop() {
		if (this.clockStartedAt === null) {
			return;
		}

		this.saveState();
		this.clockStartedAt = null;
	}

	public startBreakPeriod() {
		this.breakStartedAt = this.breakStartedAt ?? new Date();
		this.start();
	}

	public getTimeSpent(
		from: Date = new Date(`${this.getDateString()}T00:00:00Z`),
		until: Date = new Date()
	): number {
		if (!this.clockStartedAt) {
			return this.getDateData(this.getDateString(from)).timeSpent;
		}

		return (
			this.getDateData(this.getDateString(from)).timeSpent +
			this.computeSpentTime(this.clockStartedAt, from, until)
		);
	}

	public getBreakTimeSpent(
		from: Date = new Date(`${this.getDateString()}T00:00:00Z`),
		until: Date = new Date()
	): number {
		if (!this.breakStartedAt) {
			return this.getDateData(this.getDateString(from)).breakTimeSpent;
		}

		return (
			this.getDateData(this.getDateString(from)).breakTimeSpent +
			this.computeSpentTime(this.breakStartedAt, from, until)
		);
	}

	private computeSpentTime(
		start: Date,
		from: Date = new Date(`${this.getDateString()}T00:00:00Z`),
		until: Date = new Date()
	): number {
		const timeStart = Math.max(start.getTime(), from.getTime());

		return Math.max(0, until.getTime() - timeStart);
	}

	private getDateString(date: Date = new Date()): string {
		return date.toISOString().slice(0, 10);
	}

	private saveState() {
		const storeData = this.loadState() ?? {};

		if (
			this.clockStartedAt &&
			this.clockStartedAt.getDate() !== new Date().getDate()
		) {
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const yesterdayDate = this.getDateString(yesterday);
			const yesterdayStartDate = new Date(`${yesterdayDate}T00:00:00Z`);
			const todayStartDate = new Date(`${this.getDateString()}T00:00:00Z`);
			storeData[yesterdayDate] = {
				timeSpent: this.getTimeSpent(yesterdayStartDate, todayStartDate),
				breakTimeSpent: this.getBreakTimeSpent(
					yesterdayStartDate,
					todayStartDate
				),
			};
		}

		const dateKey = this.getDateString();
		storeData[dateKey] = {
			timeSpent: this.getTimeSpent(),
			breakTimeSpent: this.getBreakTimeSpent(),
		};

		this.window.localStorage.setItem(
			Clock.STORE_KEY,
			JSON.stringify(storeData)
		);
	}

	private loadState(): ClockStore | null {
		const strData = this.window.localStorage.getItem(Clock.STORE_KEY);
		if (strData === null) {
			return null;
		}
		return JSON.parse(strData);
	}

	private getDateData(dateKey: string): ClockData {
		const data = this.loadState() ?? {};
		return data[dateKey] ?? { breakTimeSpent: 0, timeSpent: 0 };
	}
}

import template from "./settings.pug";
import "./settings.scss";
import { Modal } from "../modal";
import { Inject, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";

export type SettingsData = {
	days: number[];
	startTime: string | null;
	endTime: string | null;
	dailyLimit: number | null;
	breakAllowed: boolean;
	breakDuration: number | null;
};

@Service()
export class Settings {
	public readonly prefix = `${HTML_PREFIX}__settings`;
	private readonly storeKey = `${STORE_PREFIX} Settings`;
	private readonly defaults: SettingsData = {
		days: [],
		startTime: null,
		endTime: null,
		dailyLimit: null,
		breakAllowed: false,
		breakDuration: null,
	};

	constructor(
		@Inject(WINDOW_TOKEN) private window: Window,
		private modal: Modal
	) {}

	private cachedSettings: SettingsData | null = null;

	public isSettingsSpecified() {
		return !!this.getSettings();
	}

	public getSettings(): SettingsData | null {
		if (this.cachedSettings) {
			return this.cachedSettings;
		}

		const settingsString = this.window.localStorage.getItem(this.storeKey);
		if (!settingsString) {
			return null;
		}
		this.cachedSettings = JSON.parse(settingsString);
		return this.cachedSettings;
	}

	public getSetting<K extends keyof SettingsData>(key: K): SettingsData[K] {
		return { ...this.defaults, ...this.getSettings() }[key];
	}

	public setSettings(settings: SettingsData) {
		this.window.localStorage.setItem(this.storeKey, JSON.stringify(settings));
		this.cachedSettings = settings;
	}

	public async showSettingsDialog(): Promise<SettingsData | null> {
		const templateElement = document.createElement("div");
		templateElement.innerHTML = template(this);

		const form = templateElement.querySelector(
			`#${this.prefix}`
		) as HTMLFormElement;

		this.bindFormInteraction(form);

		return new Promise((resolve) => {
			this.modal.show({ title: "Settings", content: templateElement }).then(
				// TODO: add form validation
				(result) => resolve(this.onSettingsSubmit(result, form))
			);
		});
	}

	private bindFormInteraction(form: HTMLFormElement) {
		const breakCheckbox = form.querySelector(
			'[name="breakAllowed"]'
		) as HTMLInputElement;
		breakCheckbox.addEventListener("change", () => {
			const breakDurationField = form.querySelector(
				`#${this.prefix}__break-field`
			)!;
			if (breakCheckbox.checked) {
				breakDurationField.setAttribute("style", "display: block");
			} else {
				breakDurationField.setAttribute("style", "display: none");
			}
		});
	}

	private onSettingsSubmit(
		result: boolean,
		form: HTMLFormElement
	): null | SettingsData {
		if (!result) {
			return null;
		}

		const formData = new FormData(form);
		const strData = Array.from(formData.entries())
			.filter((v) => !!v)
			.reduce(
				(res: { [k: string]: string | string[] }, [key, value]) => ({
					...res,
					[key]: res[key] ? [String(value)].concat(res[key]) : String(value),
				}),
				{}
			) as {
			[k in keyof SettingsData]?: SettingsData[k] extends Array<unknown>
				? string[]
				: string;
		};
		const data: SettingsData = {
			...this.defaults,
			...strData,
			breakAllowed: strData.breakAllowed === "on",
			breakDuration: Number(strData.breakDuration) || null,
			dailyLimit: strData.dailyLimit ? Number(strData.dailyLimit) : null,
			days: Array.from(strData.days ?? []).map(Number),
		};
		this.setSettings(data);
		return data;
	}
}

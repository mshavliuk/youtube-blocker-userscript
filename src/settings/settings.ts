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
};

@Service()
export class Settings {
	public readonly prefix = `${ HTML_PREFIX }__settings`;
	private readonly storeKey = `${STORE_PREFIX} Settings`

	constructor(@Inject(WINDOW_TOKEN) private window: Window, private modal: Modal) {}

	public isSettingsSpecified() {
		return !!this.getSettings();
	}

	public getSettings(): SettingsData | null {
		const settings = this.window.localStorage.getItem(this.storeKey);
		if(!settings) {
			return null;
		} else {
			return JSON.parse(settings);
		}
	}

	public setSettings(settings: SettingsData) {
		this.window.localStorage.setItem(this.storeKey, JSON.stringify(settings));
	}

	public async showSettingsDialog (): Promise<SettingsData | null> {
		const templateElement = document.createElement("div");
		templateElement.innerHTML = template(this);

		return new Promise((resolve) => {
			this.modal.show("Settings", templateElement).then(
				// TODO: add form validation
				(result) => {
					if(!result) {
						resolve(null);
						return;
					}

					const form = templateElement.querySelector(`#${this.prefix}`);
					const formData = new FormData(form as HTMLFormElement);
					const strData = Array.from(formData.entries())
						.filter((v) => !!v)
						.reduce((res: { [k: string]: string | string[] }, [key, value]) =>
								({ ...res, [key]: res[key] ? [String(value)].concat(res[key]) : String(value) }),
							{}) as { [k in keyof SettingsData]?: SettingsData[k] extends any[] ? string[] : string };
					const data: SettingsData = {
						endTime: null,
						startTime: null,
						...strData,
						dailyLimit: Number(strData.dailyLimit) || null,
						days: Array.from(strData.days ?? []).map(Number)
					}
					this.setSettings(data);
					resolve(data);
				}
			);
		})
	}
}

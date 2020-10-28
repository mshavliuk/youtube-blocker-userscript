import modalTemplate from "./settings-modal.pug";
import buttonTemplate from "./settings-button.pug";
import "./settings-modal.scss";
import "./settings-button.scss";
import { Modal } from "../modal";
import { Container, Service } from "typedi";
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

	private cachedSettings: SettingsData | null = null;
	private subscribers: ((_: SettingsData) => void)[] = [];

	constructor(
		container: Container,
		private window = Container.get(WINDOW_TOKEN),
		private modal = Container.get(Modal)
	) {
		this.attachCompactButton();
	}

	public isSettingsSpecified() {
		return !!this.getSettings();
	}

	public onSettingsChange(fn: (settings: SettingsData) => void) {
		this.subscribers.push(fn);
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
		const initialSettings = this.getSettings() ?? this.defaults;
		const templateElement = document.createElement("div");
		templateElement.innerHTML = modalTemplate({
			...this,
			formData: initialSettings,
		});

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

	private waitForSidebar(): Promise<HTMLDivElement> {
		return new Promise((resolve) => {
			const waitFn = () => {
				const buttonContainer = this.window.document.querySelector(
					"#content > ytd-mini-guide-renderer > #items"
				);

				if (buttonContainer) {
					resolve(buttonContainer as HTMLDivElement);
				} else {
					this.window.setTimeout(() => waitFn(), 300);
				}
			};
			waitFn();
		});
	}

	private attachCompactButton() {
		const buttonRenderWrapper = this.window.document.createElement("div");
		buttonRenderWrapper.innerHTML = buttonTemplate(this);
		const buttonElement = buttonRenderWrapper.firstElementChild!;
		buttonElement.addEventListener("click", () => this.showSettingsDialog());

		this.waitForSidebar().then((buttonContainer) => {
			buttonContainer.appendChild(buttonElement);

			new MutationObserver(() => {
				if (!buttonContainer.querySelector(`#${this.prefix}-button`)) {
					buttonContainer.appendChild(buttonElement);
				}
			}).observe(buttonContainer, { childList: true });
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
		// triggers initial state
		breakCheckbox.dispatchEvent(new Event("change"));
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
		this.notifyOnSettingsChange(data);
		return data;
	}

	private notifyOnSettingsChange(data: SettingsData) {
		this.subscribers.forEach((fn) => fn(data));
	}
}

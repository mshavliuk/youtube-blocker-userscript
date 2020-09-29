import template from "./settings.pug";
import "./settings.scss";
import { Modal } from "../modal";
import { Inject, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";

@Service()
export class Settings {
	constructor(@Inject(WINDOW_TOKEN) private window: Window, private modal: Modal) {}

	isSettingsSpecified() {
		return !!this.getSettings();
	}

	getSettings() {
		const settings = this.window.localStorage.getItem(`${STORE_PREFIX} Settings`);
		if(!settings) {
			return null;
		} else {
			return JSON.parse(settings);
		}
	}

	public async showSettingsDialog () {
		const templateElement = document.createElement("template");
		templateElement.innerHTML = template;

		return new Promise((res) => {
			this.modal.show("Settings", templateElement);
			this.modal.addOnClose((...args) => {
				console.log(args);
				console.log('settings were set!');
				res();
			})
		})
	}
}

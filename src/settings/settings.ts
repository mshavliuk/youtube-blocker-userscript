import html from "./settings.html";
import "./settings.scss";
import { Modal } from "../modal";

export class Settings {
	constructor(private window: Window) {}

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

	showSettingsDialog() {
		const modal = new Modal(window);
		const template = document.createElement("template");
		template.innerHTML = html;
		modal.show("Settings", template);
		modal.addOnClose((...args) => {
			console.log(args);
			console.log('settings were set!');
		})
	}
}

import html from "./settings.html";
import "./settings.scss";
import { Modal } from "../modal";

export class Settings {
	constructor(window) {
		const modal = new Modal(window);
		const template = document.createElement("template");
		template.innerHTML = html;
		modal.show("Settings", template);
	}
}

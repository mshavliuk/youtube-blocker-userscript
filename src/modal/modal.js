import "./modal.scss";
import modalTemplate from "./modal.html";
import MicroModal from "micromodal";

export class Modal {
	constructor(window) {
		this.window = window;
		const wrapper = window.document.createElement("div");
		wrapper.innerHTML = modalTemplate;
		this.template = wrapper.firstChild;
		window.document.body.appendChild(this.template);
		this.titleElement = this.template.querySelector("#youtube-blocker__title");
		this.contentElement = this.template.querySelector(
			"#youtube-blocker__content"
		);

		MicroModal.init({});
	}

	show(title, content) {
		this.titleElement.innerText = title;
		if (content instanceof String) {
			this.contentElement.innerText = content;
		} else if (content instanceof this.window.HTMLElement) {
			this.contentElement.innerHTML = content.innerHTML;
		}
		MicroModal.show("youtube-blocker__modal", {});
	}
}

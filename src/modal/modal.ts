import "./modal.scss";
import modalTemplate from "./modal.html";
import MicroModal, { MicroModalConfig } from "micromodal";

export class Modal {
	private titleElement: HTMLHeadingElement;
	private contentElement: HTMLDivElement;
	private onCloseFns: Array<NonNullable<MicroModalConfig['onClose']>> = [];

	constructor(window: Window) {
		const wrapper = window.document.createElement("div");
		wrapper.innerHTML = modalTemplate;
		const template = wrapper.firstChild;
		if(!(template instanceof HTMLElement)) {
			throw new Error('Template is not instanceof HTMLElement')
		}
		window.document.body.appendChild(template);
		this.titleElement = template.querySelector<HTMLHeadingElement>("#youtube-blocker__title")!;
		this.contentElement = template.querySelector<HTMLDivElement>(
			"#youtube-blocker__content"
		)!;

		MicroModal.init({
			onClose: this.onClose,
			onShow: this.onShow
		});
	}

	public addOnClose(callback: (modal?: HTMLElement) => void) {
		this.onCloseFns.push(callback);
	}

	private onClose(modal?: HTMLElement) {
		this.onCloseFns.forEach((fn) => fn(modal));
	}

	public onShow() {
		// TODO
		throw Error('not implemented');
	}

	public show(title: string, content: string | HTMLElement) {
		this.titleElement.innerText = title;
		if (typeof content === 'string') {
			this.contentElement.innerText = content;
		} else if (content instanceof HTMLElement) {
			this.contentElement.innerHTML = content.innerHTML;
		}
		MicroModal.show("youtube-blocker__modal", {});
	}
}

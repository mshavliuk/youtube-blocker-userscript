import "./modal.scss";
import MicroModal from "micromodal";
import { Inject, Service } from "typedi";
import template from "./modal.pug";
import { WINDOW_TOKEN } from "../window-token";

@Service()
export class Modal {
	public readonly prefix = `${HTML_PREFIX}__modal`;
	private readonly templateId: string;
	private readonly modalElement: HTMLElement;

	private titleElement: HTMLHeadingElement;
	private contentElement: HTMLDivElement;
	private okButtonElement: HTMLButtonElement;
	private okCallback: (() => void) | null = null;

	constructor(@Inject(WINDOW_TOKEN) private window: Window) {
		const wrapper = window.document.createElement("div");
		wrapper.innerHTML = template(this);
		const modalElement = wrapper.firstChild;
		if (!(modalElement instanceof HTMLElement)) {
			throw new Error("Template is not instanceof HTMLElement");
		}
		this.modalElement = modalElement;
		this.templateId = this.modalElement.id;
		this.titleElement = this.modalElement.querySelector<HTMLHeadingElement>(
			`#${this.prefix}__title`
		)!;
		this.contentElement = this.modalElement.querySelector<HTMLDivElement>(
			`#${this.prefix}__content`
		)!;
		this.okButtonElement = this.modalElement.querySelector<HTMLButtonElement>(
			"[data-micromodal-ok]"
		)!;
		this.okButtonElement.addEventListener("click", () => {
			if (this.okCallback) {
				this.okCallback();
			}
		});
		this.attach();
	}

	public attach() {
		this.window.document.body.appendChild(this.modalElement);
		MicroModal.init();
	}

	public show({
		title,
		content,
		cancelButton,
		okButton,
	}: {
		title: string;
		content: string | HTMLElement;
		cancelButton?: string | null;
		okButton?: string | null;
	}): Promise<boolean> {
		this.titleElement.innerText = title;
		if (typeof content === "string") {
			this.contentElement.innerText = content;
		} else if (content instanceof HTMLElement) {
			this.contentElement.appendChild(content);
		}
		return new Promise((resolve) => {
			MicroModal.show(this.templateId, {
				onClose: () => {
					this.setOkCallback(null);
					this.contentElement.innerHTML = "";
					this.titleElement.innerText = "";
					resolve(false);
				},
			});

			this.setOkCallback(() => {
				this.setOkCallback(null);
				resolve(true);
				MicroModal.close(this.templateId);
			});
		});
	}

	private setOkCallback(fn: (() => void) | null) {
		this.okCallback = fn;
	}
}

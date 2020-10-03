import "./modal.scss";
import template from "./modal.pug";
import MicroModal from "micromodal";
import { Inject, Service } from "typedi";
import { WINDOW_TOKEN } from "../window-token";

@Service()
export class Modal {
	public readonly prefix = `${ HTML_PREFIX }__modal`;
	private readonly templateId: string;
	private titleElement: HTMLHeadingElement;
	private contentElement: HTMLDivElement;
	private okButtonElement: HTMLButtonElement;
	private okCallback: (() => void) | null = null;

	constructor(@Inject(WINDOW_TOKEN) window: Window) {
		const wrapper = window.document.createElement("div");
		wrapper.innerHTML = template(this);
		const modalElement = wrapper.firstChild;
		if(!(modalElement instanceof HTMLElement)) {
			throw new Error('Template is not instanceof HTMLElement')
		}
		this.templateId = modalElement.id;
		window.document.body.appendChild(modalElement);
		this.titleElement = modalElement.querySelector<HTMLHeadingElement>("#youtube-blocker__title")!;
		this.contentElement = modalElement.querySelector<HTMLDivElement>(
			"#youtube-blocker__content"
		)!;
		this.okButtonElement = modalElement.querySelector<HTMLButtonElement>('[data-micromodal-ok]')!
		this.okButtonElement.addEventListener('click', () => {
			if(this.okCallback) {
				this.okCallback();
			}
		})
		MicroModal.init();
	}

	private setOkCallback(fn: (() => void) | null) {
		this.okCallback = fn;
	}

	public show(title: string, content: string | HTMLElement): Promise<boolean> {
		this.titleElement.innerText = title;
		if (typeof content === 'string') {
			this.contentElement.innerText = content;
		} else if (content instanceof HTMLElement) {
			this.contentElement.appendChild(content);
		}
		return new Promise((resolve) => {
			MicroModal.show(this.templateId, {
				onClose: () => {
					this.setOkCallback(null);
					this.contentElement.innerHTML = '';
					this.titleElement.innerText = '';
					resolve(false);
				}
			});

			this.setOkCallback(() => {
				this.setOkCallback(null);
				resolve(true);
				MicroModal.close(this.templateId);
			});
		})
	}
}

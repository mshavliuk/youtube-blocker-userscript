import "./modal.scss";
import MicroModal from "micromodal";
import { Container, Service } from "typedi";
import template from "./modal.pug";
import { WINDOW_TOKEN } from "../window-token";

export interface ShowModalOptions {
	title: string;
	content: string | HTMLElement;
	closeButton: string | null;
	okButton: string | null;
	validator: (() => Partial<Record<string, string>> | null) | null;
}

@Service()
export class Modal {
	public readonly prefix = `${HTML_PREFIX}__modal`;

	private readonly modalOptionsDefaults: ShowModalOptions = {
		title: "",
		content: "",
		closeButton: "Close",
		okButton: "Ok",
		validator: null,
	};

	private okCallback: (() => boolean) | null = null;

	constructor(
		container: Container,
		private window = Container.get(WINDOW_TOKEN)
	) {}

	public show(options: Partial<ShowModalOptions>): Promise<boolean> {
		const modalElement = this.render(options);

		this.window.document.body.appendChild(modalElement);
		MicroModal.init();

		return new Promise((resolve) => {
			MicroModal.show(modalElement.id, {
				onClose: () => {
					this.window.document.body.removeChild(modalElement);
					resolve(false);
				},
			});

			this.okCallback = () => {
				if (options.validator) {
					const errors = options.validator();
					if (errors) {
						this.window.alert(Object.values(errors).join("\n"));
						return false;
					}
				}
				resolve(true);
				MicroModal.close(modalElement.id);
				this.okCallback = null;
				return true;
			};
		});
	}

	private render(options: Partial<ShowModalOptions>): HTMLElement {
		const renderOptions: ShowModalOptions & this = {
			...this.modalOptionsDefaults,
			...this,
			...options,
		};

		if (options.content instanceof HTMLElement) {
			renderOptions.content = "";
		}

		const wrapper = window.document.createElement("div");
		wrapper.innerHTML = template(renderOptions);

		const modalElement = wrapper.firstElementChild;
		if (!(modalElement instanceof HTMLElement)) {
			throw new Error("Template is not instanceof HTMLElement");
		}

		const okButton = modalElement.querySelector<HTMLButtonElement>(
			"[data-micromodal-ok]"
		)!;

		okButton.addEventListener("click", (event) => {
			event.preventDefault();
			if (this.okCallback) {
				return this.okCallback();
			}
			return true;
		});

		if (options.content instanceof HTMLElement) {
			const contentElement = modalElement.querySelector<HTMLDivElement>(
				`#${this.prefix}__content`
			)!;
			contentElement.appendChild(options.content);
		}

		const contentForms = modalElement.querySelectorAll("form");
		if (contentForms.length === 1) {
			const contentForm = contentForms.item(0);
			contentForm.id = contentForm.id ?? `${this.prefix}__form`;
			okButton.setAttribute("form", contentForm.id);
		}

		return modalElement;
	}
}

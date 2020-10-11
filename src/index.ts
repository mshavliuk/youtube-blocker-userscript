import "reflect-metadata";

import { Container } from "typedi";
import { Clock } from "./clock";
import { Settings } from "./settings";
import { WINDOW_TOKEN } from "./window-token";
import { Blocker } from "./blocker";

function isReady(window: Window): boolean {
	return (
		window.document.body instanceof HTMLElement &&
		window.localStorage instanceof Storage &&
		window.document instanceof Document
	);
}

(async function main(window) {
	await (() =>
		new Promise((resolve) => {
			const timer = (counter = 0) => {
				if (isReady(window)) {
					resolve();
				} else {
					setTimeout(() => timer(counter), ++counter * 50);
				}
			};
			timer();
		}))();

	Container.set(WINDOW_TOKEN, window);
	const clock = Container.get(Clock);
	clock.start();
	window.addEventListener("beforeunload", () => {
		clock.stop();
	});
	const settings = Container.get(Settings);
	if (!settings.isSettingsSpecified()) {
		await settings.showSettingsDialog();
	}
	Container.get(Blocker);
})(typeof unsafeWindow !== "undefined" ? unsafeWindow : window);

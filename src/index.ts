import { Clock } from "./clock";
import { Settings } from "./settings";
import { Modal } from "./modal";

(async function (window) {
	const waitForBody = () => {
		let counter = 0;
		return new Promise((resolve) => {
			const timer = () => {
				if (window.document.body) {
					resolve();
				} else {
					counter++;
					setTimeout(timer, counter * 50);
				}
			};
			timer();
		});
	};

	await waitForBody();

	const main = () => {
		console.log("run main");

		const clock = new Clock(window);

		window.addEventListener("beforeunload", () => {
			clock.stop();
		});

		const settings = new Settings(window);
		if(!settings.isSettingsSpecified()) {
			settings.showSettingsDialog();
		}

		const todayDateString = new Date().toISOString().slice(0, 10);

		const scheduleBlockStart = "08:00";
		const scheduleBlockStop = "23:59";

		const blockTimeStart = Date.parse(
			`${todayDateString}T${scheduleBlockStart}`
		);
		const blockTimeStop = Date.parse(`${todayDateString}T${scheduleBlockStop}`);

		const timeSinceStartOfBlock = Date.now() - blockTimeStart;
		const timeUntilEndOfBlock = blockTimeStop - Date.now();

		// const destroyThePage = () => {
		// 	window.document.body.innerHTML = "";
		// };

		const blockTheSite = () => {
			// destroyThePage();
			const modal = new Modal(window);
			modal.show(
				"Let's get a grip!",
				"You seem to visit this site in restricted time"
			);
		};

		if (timeSinceStartOfBlock > 0 && timeUntilEndOfBlock > 0) {
			blockTheSite();
		} else if (timeSinceStartOfBlock < 0) {
			setTimeout(blockTheSite, -timeSinceStartOfBlock);
		}
	};

	main();
})(typeof unsafeWindow !== "undefined" ? unsafeWindow : window);

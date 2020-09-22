import { Modal } from "./modal";
import { Clock } from "./clock";
import { Settings } from "./settings";
/* global unsafeWindow */

(async function (unsafeWindow) {
	const waitForBody = () => {
		let counter = 0;
		return new Promise((resolve) => {
			const timer = () => {
				if (document.body) {
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

		const clock = new Clock(unsafeWindow);

		unsafeWindow.addEventListener("beforeunload", () => {
			clock.stop();
		});

		new Settings(unsafeWindow);
		// return;

		const todayDateString = new Date().toISOString().slice(0, 10);

		const scheduleBlockStart = "08:00";
		const scheduleBlockStop = "23:59";

		const blockTimeStart = Date.parse(
			`${todayDateString}T${scheduleBlockStart}`
		);
		const blockTimeStop = Date.parse(`${todayDateString}T${scheduleBlockStop}`);

		const timeSinceStartOfBlock = Date.now() - blockTimeStart;
		const timeUntilEndOfBlock = blockTimeStop - Date.now();

		const destroyThePage = () => {
			unsafeWindow.document.body.innerHTML = "";

			unsafeWindow.XMLHttpRequest.prototype.send = () => false;
		};

		const blockTheSite = () => {
			destroyThePage();
			const modal = new Modal();
			modal.show(
				"Let's get a grip!",
				"You seem to visit this site in restricted time"
			);
		};

		if (timeSinceStartOfBlock > 0 && timeUntilEndOfBlock > 0) {
			let counter = 0;
			// FIXME: find more elegant solution 🤔
			const blockTimer = () => {
				if (unsafeWindow.document.body) {
					blockTheSite();
				} else {
					counter++;
					setTimeout(blockTimer, counter * 50);
				}
			};
			setTimeout(blockTimer);
		} else if (timeSinceStartOfBlock < 0) {
			setTimeout(blockTheSite, -timeSinceStartOfBlock);
		}
	};

	main();
})(typeof unsafeWindow !== "undefined" ? unsafeWindow : window);

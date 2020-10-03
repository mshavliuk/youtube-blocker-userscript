import "reflect-metadata";

import { Clock } from "./clock";
import { Settings } from "./settings";
import { Container } from "typedi";
import { WINDOW_TOKEN } from "./window-token";
import { Blocker } from "./blocker";

(async function(window) {
  await (() => new Promise((resolve) => {
    const timer = (counter = 0) => {
      if (window.document.body) {
        resolve();
      } else {
        setTimeout(() => timer(counter), ++counter * 50);
      }
    };
    timer();
  }))();

  Container.set(WINDOW_TOKEN, window);
  const clock = Container.get(Clock);
  window.addEventListener("beforeunload", () => {
    clock.stop();
  });
  const settings = Container.get(Settings);
  if (!settings.isSettingsSpecified()) {
    await settings.showSettingsDialog();
  }

  Container.get(Blocker);

})(typeof unsafeWindow !== "undefined" ? unsafeWindow : window);

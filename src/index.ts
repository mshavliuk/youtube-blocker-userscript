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
  // FIXME: Blocker could be instantiated asynchronously, but typedi doesn't support it
  // see https://github.com/typestack/typedi/pull/126

  const blocker = Container.get(Blocker);
  if (!settings.isSettingsSpecified()) {
    await settings.showSettingsDialog();
  }
  blocker.start();

})(typeof unsafeWindow !== "undefined" ? unsafeWindow : window);

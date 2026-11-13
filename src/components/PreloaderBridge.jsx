import { useEffect, useState } from "react";
import { preloader, loadTasks } from "../lib/preloader.js";

export default function PreloaderBridge({ sceneReady, tunnelReady, glassReady, onReady, onComplete }) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      document.fonts.load('400 16px "Neue Haas Grotesk Display Pro"'),
      document.fonts.load('500 16px "Neue Haas Grotesk Display Pro"'),
      document.fonts.load('400 14px "Geist Mono"'),
      document.fonts.load('400 14px "NP Geist Mono"'),
      document.fonts.load('400 16px "NP Neue Haas Display"', "0123456789%"),
      document.fonts.ready,
    ])
      .then(() => {
        if (!alive) return;
        loadTasks.ui.done();
        setFontsReady(true);
      })
      .catch((error) => {
        console.error("[NODDAL preloader] Interface fonts:", error);
        preloader.setStatus("[load error · please reload]");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (sceneReady) loadTasks.hero.done();
    if (tunnelReady) loadTasks.tunnel.done();
    if (glassReady) loadTasks.continuation.done();
    if (sceneReady && tunnelReady && glassReady && fontsReady) preloader.ready();
  }, [sceneReady, tunnelReady, glassReady, fontsReady]);

  useEffect(() => {
    addEventListener("noddal:exit", onReady);
    addEventListener("noddal:complete", onComplete);
    if (["exit", "reveal"].includes(preloader.phase)) onReady();
    if (preloader.phase === "done") onComplete();
    return () => {
      removeEventListener("noddal:exit", onReady);
      removeEventListener("noddal:complete", onComplete);
    };
  }, [onReady, onComplete]);

  return null;
}

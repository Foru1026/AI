import { useEffect, useState } from "react";
import { preloader, loadTasks } from "../lib/preloader.ts";

export default function PreloaderBridge({ sceneReady, tunnelReady, glassReady, onReady, onComplete }) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    // Only the fonts needed for the first screen. Preloader already embeds its own subset fonts.
    Promise.all([
      document.fonts.load('400 16px "Neue Haas Grotesk Display Pro"'),
      document.fonts.load('400 14px "Geist Mono"'),
    ])
      .then(() => {
        if (!alive) return;
        loadTasks.ui.done();
        setFontsReady(true);
      })
      .catch((error) => {
        console.error("[NODDAL preloader] Interface fonts:", error);
        if (!alive) return;
        loadTasks.ui.done();
        setFontsReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (sceneReady) loadTasks.hero.done();
    if (tunnelReady) loadTasks.tunnel.done();
    if (glassReady) loadTasks.continuation.done();
    // Unlock as soon as the first screen can paint. Datacluster keeps loading behind.
    if (sceneReady && tunnelReady && fontsReady) {
      loadTasks.continuation.done();
      preloader.ready();
    }
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

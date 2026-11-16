import { useEffect, useState } from "react";
import { preloader, loadTasks } from "../lib/preloader.ts";

const FIRST_SCREEN_FONTS = [
  ['500 80px "Neue Haas Grotesk Display Pro"', "Neue Haas Grotesk Display Pro", "500"],
  ['400 16px "Neue Haas Grotesk Display Pro"', "Neue Haas Grotesk Display Pro", "400"],
  ['400 14px "Geist Mono"', "Geist Mono", "400"],
];

function faceFamily(face) {
  return face.family.replaceAll('"', "");
}

function faceState(family, weight) {
  return [...document.fonts].find((face) => faceFamily(face) === family && String(face.weight) === weight)?.status;
}

export default function PreloaderBridge({ sceneReady, tunnelReady, glassReady, onReady, onComplete }) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const start = performance.now();
      // The faces live in the app stylesheet. On a slow connection that file arrives after this effect.
      while (alive && performance.now() - start < 12000) {
        if (FIRST_SCREEN_FONTS.every(([, family, weight]) => faceState(family, weight))) break;
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      if (!alive) return;
      await Promise.all(FIRST_SCREEN_FONTS.map(([spec]) => document.fonts.load(spec).catch(() => [])));
      if (!alive) return;
      await document.fonts.ready.catch(() => {});
      if (!alive) return;
      loadTasks.ui.done();
      setFontsReady(true);
    })().catch((error) => {
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
  }, [sceneReady, tunnelReady, glassReady]);

  useEffect(() => {
    // The preloader's own timeout must not uncover the page. Open only once the
    // hero models, tunnel frame and the real first-screen fonts can paint.
    if (!sceneReady || !tunnelReady || !fontsReady) return undefined;
    loadTasks.continuation.done();
    preloader.ready();
    const open = () => onReady();
    const finish = () => onComplete();
    if (preloader.phase === "done") {
      open();
      finish();
      return undefined;
    }
    if (["exit", "reveal"].includes(preloader.phase)) open();
    addEventListener("noddal:exit", open);
    addEventListener("noddal:complete", finish);
    return () => {
      removeEventListener("noddal:exit", open);
      removeEventListener("noddal:complete", finish);
    };
  }, [sceneReady, tunnelReady, fontsReady, onReady, onComplete]);

  return null;
}

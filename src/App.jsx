import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Lenis from "lenis";
import { Canvas } from "@react-three/fiber";
import {
  CAMERA_FOV,
  CAMERA_START,
  CONTINUATION_PAGE,
  GLASS_SCREENS,
  HANDOFF_PAGE,
  JOURNEY_SPLIT,
  LENIS,
  cancelReversalFor,
  chapterScroll,
  createSnapper,
  currentProfile,
  easeOutCubic,
  glassChapter,
  glassProgress,
  heroProgress,
  heroProgressToScreens,
  heroScreens,
  journeyProgress,
  journeyScreens,
  keyScrollDelta,
  loadLens,
  navigateTo,
  saveLens,
  sceneFor,
  scrollBy,
} from "./lib/timeline.js";
import { preloader, loadTasks } from "./lib/preloader.ts";
import { postToFrame as post, readFrameMessage } from "./bridge/datacluster.ts";
import { ASSETS } from "./config/assets.ts";
import { MEDIA } from "./config/breakpoints.ts";
import GlassTunnel from "./components/GlassTunnel.jsx";
import HeroScene from "./components/hero/HeroScene.jsx";
import Atmosphere from "./components/Atmosphere.jsx";
import SiteInterface from "./components/interface/SiteInterface.jsx";
import CustomCursor from "./components/CustomCursor.jsx";
import PreloaderBridge from "./components/PreloaderBridge.jsx";

export default function App() {
  const [optics] = useState(loadLens);
  const opticsRef = useRef(optics);
  opticsRef.current = optics;

  const experience = useRef();
  const ui = useRef();
  const cursor = useRef();
  const heroCanvas = useRef();
  const tunnel = useRef();
  const continuation = useRef();
  const frame = useRef();

  const [mountFrame, setMountFrame] = useState(false);
  const [frameActive, setFrameActive] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [glassReady, setGlassReady] = useState(false);

  const glass = useRef(0);
  const journey = useRef(0);
  const scaleIntro = useRef(0);
  const lenis = useRef(null);
  const snapper = useRef(null);
  const layout = useRef(null);
  const pupilCovered = useRef(false);
  const lastScroll = useRef(0);
  const speed = useRef(0);
  const glassReadyRef = useRef(false);
  glassReadyRef.current = glassReady;

  const heroBaseScreens = useCallback(
    () => Number(getComputedStyle(experience.current).getPropertyValue("--hero-scroll-screens")),
    [],
  );
  const navigate = useCallback(
    (chapter) => {
      snapper.current?.reset();
      navigateTo(lenis.current, chapterScroll(chapter, heroBaseScreens(), layout.current?.unit || innerHeight));
    },
    [heroBaseScreens],
  );

  const pointer = useRef(new THREE.Vector3());
  const page = useRef(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [tunnelReady, setTunnelReady] = useState(false);
  const [phase, setPhase] = useState(() => (preloader.phase === "done" ? "done" : "loading"));
  const interactive = useRef(false);
  interactive.current = phase === "done";
  const snapReady = useRef(false);
  snapReady.current = interactive.current && tunnelReady;

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onTunnelReady = useCallback(() => setTunnelReady(true), []);
  useEffect(() => {
    if (sceneReady) setMountFrame(true);
  }, [sceneReady]);
  const onRevealing = useCallback(() => setPhase("revealing"), []);
  const onDone = useCallback(() => setPhase("done"), []);
  useEffect(() => {
    if (phase === "done") lenis.current?.start();
    else lenis.current?.stop();
  }, [phase]);

  const onPointerMove = (e) => {
    pointer.current.set((e.clientX / innerWidth - 0.5) * 2, -(e.clientY / innerHeight - 0.5) * 2, 1);
    post(frame.current, { type: "pointer", value: { x: pointer.current.x, y: pointer.current.y, active: true } });
  };
  const onPointerLeave = () => {
    pointer.current.z = 0;
    post(frame.current, { type: "pointer", value: { x: 0, y: 0, active: false } });
  };

  const syncFrame = useCallback(() => {
    post(frame.current, { type: "active", value: frameActive });
    post(frame.current, { type: "progress", value: glass.current, journey: journey.current, speed: speed.current });
    post(frame.current, { type: "optics", value: opticsRef.current });
  }, [frameActive]);

  useEffect(() => {
    syncFrame();
  }, [syncFrame, handoff]);

  useEffect(() => {
    saveLens(optics);
    post(frame.current, { type: "optics", value: optics });
  }, [optics]);

  useEffect(() => {
    const onMessage = (e) => {
      const message = readFrameMessage(e, frame);
      if (!message) return;
      const { type } = message;
      if (type === "ready") syncFrame();
      if (type === "scene-ready") setGlassReady(true);
      if (type === "loading-progress") loadTasks.continuation.progress(message.value);
      if (type === "pupil-covered") pupilCovered.current = message.value === true;
      if (type === "touch-state") snapper.current?.touch(message.value === true);
      if (type === "portal-state" && experience.current) {
        experience.current.dataset.portalPhase = message.phase;
        if (journey.current > 0 && journey.current < JOURNEY_SPLIT && Number.isFinite(message.uiOpacity)) {
          scaleIntro.current = message.uiOpacity;
        }
      }
      if (type === "scroll" && interactive.current) {
        const delta = Number(message.delta);
        if (Number.isFinite(delta)) {
          if (lenis.current) {
            snapper.current?.gesture(delta, performance.now());
            scrollBy(lenis.current, delta, message.source);
          } else {
            window.scrollBy({ top: delta, behavior: "instant" });
          }
        }
      }
      if (type === "error") {
        console.error("[Datacluster]", message.message);
        if (!interactive.current) preloader.setStatus("[load error · please reload]");
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, [syncFrame]);

  useEffect(() => {
    const instance = new Lenis({
      ...LENIS,
      easing: easeOutCubic,
      lerp: 0,
      autoRaf: false,
      smoothWheel: true,
      virtualScroll: ({ deltaY, event }) => {
        if (!interactive.current) return false;
        if (!event.ctrlKey && !event.target?.closest?.("[data-lenis-prevent]")) {
          if (event.type.startsWith("touch")) {
            snapper.current?.touch(event.type !== "touchend" && event.type !== "touchcancel");
          }
          snapper.current?.gesture(deltaY, performance.now());
          cancelReversalFor(instance, deltaY);
        }
      },
    });
    lenis.current = instance;
    if (!interactive.current) {
      instance.stop();
      instance.scrollTo(0, { immediate: true, force: true });
    }
    const snap = createSnapper(instance);
    snapper.current = snap;
    const reducedMotion = matchMedia(MEDIA.reducedMotion);

    const measure = () => {
      const profile = currentProfile();
      const el = experience.current;
      el.dataset.deviceProfile = profile;
      el.style.setProperty("--journey-scroll-screens", String(journeyScreens(profile)));
      const style = getComputedStyle(el);
      const baseScreens = Number(style.getPropertyValue("--hero-scroll-screens"));
      const totalScreens = 1 + heroScreens(baseScreens) + GLASS_SCREENS + journeyScreens(profile);
      const unit = profile === "desktop" ? innerHeight : parseFloat(style.height) / totalScreens;
      layout.current = { profile, baseScreens, unit };
      return layout.current;
    };
    let current = measure();

    const onKey = (e) => {
      const delta = keyScrollDelta(e, innerHeight, instance.limit, instance.targetScroll);
      if (delta === null) return;
      e.preventDefault();
      if (interactive.current) {
        snap.gesture(delta, performance.now());
        scrollBy(instance, delta, "keyboard");
      }
    };
    addEventListener("keydown", onKey);

    let raf = 0;
    let last = performance.now();
    let height = innerHeight;
    let width = innerWidth;
    const flags = { loaded: false, continuation: false, handoff: false };

    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
      last = now;
      if (!interactive.current && (instance.actualScroll !== 0 || instance.targetScroll !== 0)) {
        instance.scrollTo(0, { immediate: true, force: true });
      }
      instance.raf(now);
      const continuationReady = glassReadyRef.current;
      if (height !== innerHeight || width !== innerWidth) {
        if (width !== innerWidth) snap.reset();
        height = innerHeight;
        width = innerWidth;
        current = measure();
      }
      const { profile, baseScreens, unit } = current;
      const heroEnd = unit * heroScreens(baseScreens);
      const targetPage = heroProgress(instance.targetScroll / unit, baseScreens);
      if (!flags.loaded && targetPage > 0.7) {
        flags.loaded = true;
        setMountFrame(true);
      }
      // Hold the scroll at the tunnel exit until the datacluster scenes are ready.
      const gate = heroProgressToScreens(CONTINUATION_PAGE, baseScreens) * unit;
      if (!continuationReady && instance.scroll > gate) instance.scrollTo(gate, { immediate: true });

      const scroll = instance.scroll;
      speed.current = dt > 0 ? Math.abs(scroll - lastScroll.current) / unit / dt : 0;
      lastScroll.current = scroll;
      page.current = heroProgress(scroll / unit, baseScreens);
      const p = page.current;
      tunnel.current?.update(now, p, pointer.current, speed.current);
      glass.current = glassProgress((scroll - heroEnd) / unit);
      journey.current = journeyProgress((scroll - heroEnd) / unit - GLASS_SCREENS, profile);
      cursor.current?.update(p, glass.current, journey.current);

      const passage = snap.update(
        {
          profile,
          baseScreens,
          unit,
          page: p,
          glass: glass.current,
          journeyLocal: journey.current / JOURNEY_SPLIT,
          pupilCovered: pupilCovered.current,
          ready: snapReady.current,
          glassReady: continuationReady,
          reduced: reducedMotion.matches,
        },
        now,
      );
      if (passage) experience.current.dataset.lastPassage = passage;
      if (journey.current <= 0 || journey.current >= JOURNEY_SPLIT) scaleIntro.current = 0;

      const chapter =
        p < 1 ? "tunnel" : journey.current > 0 ? (journey.current < JOURNEY_SPLIT ? "portal" : "social") : glassChapter(glass.current);
      if (experience.current && experience.current.dataset.chapter !== chapter) experience.current.dataset.chapter = chapter;
      ui.current?.update(sceneFor(p, glass.current, journey.current, scaleIntro.current), glass.current, 1, journey.current);

      const takeOver = continuationReady && p >= CONTINUATION_PAGE;
      const handedOff = p >= HANDOFF_PAGE;
      if (takeOver !== flags.continuation) {
        flags.continuation = takeOver;
        setFrameActive(takeOver);
      }
      if (handedOff !== flags.handoff) {
        flags.handoff = handedOff;
        setHandoff(handedOff);
      }
      post(frame.current, { type: "progress", value: glass.current, journey: journey.current, speed: speed.current });
      if (heroCanvas.current) {
        heroCanvas.current.style.pointerEvents = handedOff ? "none" : "auto";
        heroCanvas.current.classList.toggle("is-inactive", handedOff);
      }
      if (continuation.current) {
        continuation.current.style.opacity = p >= CONTINUATION_PAGE ? "1" : "0";
        continuation.current.style.pointerEvents = p >= 0.999 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.current = null;
      snapper.current = null;
      removeEventListener("keydown", onKey);
      instance.destroy();
    };
  }, [heroBaseScreens]);

  return (
    <div
      className="experience"
      ref={experience}
      style={{ "--glass-scroll-screens": GLASS_SCREENS }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className={`hero${phase !== "done" ? " is-loading" : ""}`}>
        <div className="continuation" ref={continuation} aria-label="Datacluster scenes">
          {mountFrame && (
            <iframe
              ref={frame}
              className="is-current"
              src={ASSETS.datacluster}
              title="NODDAL — glass, eye, energy portal and social"
              onLoad={syncFrame}
            />
          )}
        </div>
        <GlassTunnel ref={tunnel} onReady={onTunnelReady} />
        <div className="scene-canvas" ref={heroCanvas}>
          <Canvas
            frameloop={handoff ? "never" : "always"}
            dpr={[1, 1.65]}
            camera={{ position: CAMERA_START, fov: CAMERA_FOV }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <HeroScene pointer={pointer} scroll={page} motion={speed} optics={opticsRef} onReady={onSceneReady} />
          </Canvas>
        </div>
        <Atmosphere scroll={page} />
        <SiteInterface ref={ui} ready={phase !== "loading"} musicReady={phase === "done"} onNavigate={navigate} />
        <CustomCursor ref={cursor} ready={phase === "done"} frame={frame} />
        {phase !== "done" && (
          <PreloaderBridge
            sceneReady={sceneReady}
            tunnelReady={tunnelReady}
            glassReady={glassReady}
            onReady={onRevealing}
            onComplete={onDone}
          />
        )}
      </div>
    </div>
  );
}

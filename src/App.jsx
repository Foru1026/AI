import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Lenis from "lenis";
import { Canvas } from "@react-three/fiber";
import {
  CAMERA_FOV,
  CAMERA_START,
  CONTINUATION_PAGE,
  PORTAL_HOLD_PAGE,
  GLASS_SCREENS,
  HANDOFF_PAGE,
  HERO_EXIT,
  HERO_SCALE,
  JOURNEY_SPLIT,
  LENIS,
  cancelReversalFor,
  chapterScroll,
  createSnapper,
  currentProfile,
  easeOutCubic,
  easeSmooth,
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
import { projectIndex } from "./data/projects.js";

export default function App() {
  const opticsRef = useRef(loadLens());

  const experience = useRef();
  const ui = useRef();
  const cursor = useRef();
  const atmosphere = useRef();
  const heroCanvas = useRef();
  const tunnel = useRef();
  const continuation = useRef();
  const frame = useRef();
  const lastProgress = useRef({ glass: -1, journey: -1, speed: -1 });

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

  const heroBaseScreens = useCallback(() => {
    const el = experience.current;
    if (!el) return 3.7;
    return Number(getComputedStyle(el).getPropertyValue("--hero-scroll-screens")) || 3.7;
  }, []);
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
  // Stay covered until the hero itself is ready. A preloader timeout must not
  // count as ready — on a slow connection that uncovers an unfinished scene.
  const [phase, setPhase] = useState("loading");
  const interactive = useRef(false);
  interactive.current = phase === "done";
  const snapReady = useRef(false);
  snapReady.current = interactive.current && tunnelReady;

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onTunnelReady = useCallback(() => setTunnelReady(true), []);
  // The hero's first frame is on the GPU. Start the next page now, while the
  // loader finishes and the hero is on screen, so the portal is not the wait.
  useEffect(() => {
    if (sceneReady) setMountFrame(true);
  }, [sceneReady]);
  const onRevealing = useCallback(() => setPhase("revealing"), []);
  const onDone = useCallback(() => setPhase("done"), []);
  const [project, setProject] = useState(null);
  const projectOpen = useRef(false);
  projectOpen.current = project !== null;
  const openProject = useCallback((slug) => {
    if (projectIndex(slug) >= 0) setProject(slug);
  }, []);
  const closeProject = useCallback(() => setProject(null), []);
  useEffect(() => {
    if (phase === "done" && !project) lenis.current?.start();
    else lenis.current?.stop();
    if (project) post(frame.current, { type: "pointer", value: { x: 0, y: 0, active: false } });
  }, [phase, project]);

  const onPointerMove = (e) => {
    if (projectOpen.current) return;
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
    const onMessage = (e) => {
      const message = readFrameMessage(e, frame);
      if (!message) return;
      const { type } = message;
      if (type === "ready") syncFrame();
      if (type === "scene-ready") setGlassReady(true);
      if (type === "loading-progress") loadTasks.continuation.progress(message.value);
      if (type === "pupil-covered") pupilCovered.current = message.value === true;
      if (type === "touch-state") snapper.current?.touch(message.value === true);
      if (type === "project-open" && interactive.current && typeof message.slug === "string") openProject(message.slug);
      if (type === "portal-state" && experience.current) {
        experience.current.dataset.portalPhase = message.phase;
        if (journey.current > 0 && journey.current < JOURNEY_SPLIT && Number.isFinite(message.uiOpacity)) {
          scaleIntro.current = message.uiOpacity;
        }
      }
      if (type === "scroll" && interactive.current && !projectOpen.current) {
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
  }, [syncFrame, openProject]);

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
      el.style.setProperty("--hero-scale", String(HERO_SCALE));
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
      if (projectOpen.current) return;
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
    const flags = { continuation: false, handoff: false, reveal: 0, held: false };

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
      // Hold on the portal, before the square turns white, until the next page can draw.
      const gate = heroProgressToScreens(PORTAL_HOLD_PAGE, baseScreens) * unit;
      if (!continuationReady && instance.scroll > gate) {
        flags.held = true;
        instance.scrollTo(gate, { immediate: true });
      } else if (flags.held && continuationReady) {
        flags.held = false;
        const into = unit * (heroScreens(baseScreens) + 0.035);
        if (instance.scroll < into - 1) {
          instance.scrollTo(into, { programmatic: true, duration: 0.42, easing: easeSmooth, lerp: 0 });
        }
      }

      const scroll = instance.scroll;
      speed.current = dt > 0 ? Math.abs(scroll - lastScroll.current) / unit / dt : 0;
      lastScroll.current = scroll;
      page.current = heroProgress(scroll / unit, baseScreens);
      const p = page.current;
      atmosphere.current?.update(p);
      glass.current = glassProgress((scroll - heroEnd) / unit);
      journey.current = journeyProgress((scroll - heroEnd) / unit - GLASS_SCREENS, profile);
      cursor.current?.update(p, glass.current, journey.current, projectOpen.current);

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
      ui.current?.update(sceneFor(p, glass.current, journey.current, scaleIntro.current), glass.current, journey.current, p);

      // Draw the next scene through the tunnel, hidden, so the first view is already settled.
      const frameWarm = continuationReady && p >= 0.7;
      const open = continuationReady && p >= CONTINUATION_PAGE ? 1 : 0;
      const reveal = flags.reveal + (open - flags.reveal) * Math.min(1, dt / 0.14);
      flags.reveal = Math.abs(open - reveal) < 0.01 ? open : reveal;
      tunnel.current?.update(now, p, pointer.current, speed.current, 1 - flags.reveal);
      const handedOff = p >= HANDOFF_PAGE;
      if (frameWarm !== flags.continuation) {
        flags.continuation = frameWarm;
        setFrameActive(frameWarm);
      }
      if (handedOff !== flags.handoff) {
        flags.handoff = handedOff;
        setHandoff(handedOff);
      }
      if (frame.current && (frameWarm || glass.current > 0 || journey.current > 0)) {
        const prev = lastProgress.current;
        const g = glass.current;
        const j = journey.current;
        const s = speed.current;
        if (Math.abs(prev.glass - g) > 0.0005 || Math.abs(prev.journey - j) > 0.0005 || Math.abs(prev.speed - s) > 0.02) {
          prev.glass = g;
          prev.journey = j;
          prev.speed = s;
          post(frame.current, { type: "progress", value: g, journey: j, speed: s });
        }
      }
      if (heroCanvas.current) {
        heroCanvas.current.style.pointerEvents = handedOff ? "none" : "auto";
        heroCanvas.current.classList.toggle("is-inactive", handedOff);
      }
      if (continuation.current) {
        continuation.current.style.opacity = String(flags.reveal);
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
      <div className={`hero${phase === "loading" ? " is-booting" : ""}`}>
        <div className="continuation" ref={continuation} aria-label="Datacluster scenes">
          {mountFrame && (
            <iframe
              ref={frame}
              className="is-current"
              src={ASSETS.datacluster}
              title="4U — interactive 3D scenes"
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
            <HeroScene
              pointer={pointer}
              scroll={page}
              motion={speed}
              optics={opticsRef}
              onReady={onSceneReady}
              loadExtras={phase !== "loading"}
            />
          </Canvas>
        </div>
        <Atmosphere ref={atmosphere} />
        <SiteInterface
          ref={ui}
          ready={phase !== "loading"}
          onNavigate={navigate}
          project={project}
          onProject={openProject}
          onCloseProject={closeProject}
        />
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

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  BUILD_STATES,
  STORY_LINES,
  interfaceFades,
  moduleStats,
  redactedArrives,
  storyLineState,
  tunnelStory,
} from "../../lib/timeline.js";
import { MEDIA } from "../../config/breakpoints.ts";
import SiteHeader from "../sections/SiteHeader.jsx";
import HeroSection from "../sections/HeroSection.jsx";
import TunnelSection from "../sections/TunnelSection.jsx";
import FeaturesSection from "../sections/FeaturesSection.jsx";
import ModuleSection from "../sections/ModuleSection.jsx";
import ScaleSection from "../sections/ScaleSection.jsx";
import ContactFooter from "../sections/ContactFooter.jsx";
import ChapterNav from "../sections/ChapterNav.jsx";
import ProjectPanel from "../sections/ProjectPanel.jsx";
import { PROJECTS } from "../../data/projects.js";
import { runRedactedGlitch } from "./glitch.js";

export default function SiteInterface({ ref, ready, onNavigate, project, onProject, onCloseProject }) {
  const root = useRef(null);
  const metrics = useRef({});
  const headlines = useRef({});
  const navLabel = useRef(null);
  const footer = useRef(null);
  const tunnelStoryEl = useRef(null);
  const tunnelYearEl = useRef(null);
  const tunnelLineEl = useRef(null);
  const lastGlass = useRef(0);
  const lastTunnel = useRef({ story: -1, year: "", lineOpacity: -1 });
  const lastCallouts = useRef(-1);
  const [ui, setUi] = useState({ scene: "hero", visible: true });
  const [glitchToken, setGlitchToken] = useState(0);
  const uiKey = useRef("hero:true");

  useEffect(() => {
    if (!glitchToken) return undefined;
    const label = navLabel.current;
    if (ui.scene !== "redacted" || !ui.visible || !label || matchMedia(MEDIA.reducedMotion).matches) {
      return undefined;
    }
    return runRedactedGlitch([label]);
  }, [glitchToken, ui.scene, ui.visible]);

  useImperativeHandle(
    ref,
    () => ({
      update(scene, glass, journey = 0, page = 0) {
        const entrance = redactedArrives(lastGlass.current, glass);
        lastGlass.current = glass;
        footer.current?.update(journey);
        root.current?.style.setProperty("--interface-opacity", String(scene.opacity));
        const callouts = interfaceFades(glass).callouts;
        if (lastCallouts.current !== callouts) {
          lastCallouts.current = callouts;
          root.current?.style.setProperty("--ui-callouts", String(callouts));
        }
        for (const [chapter, lines] of Object.entries(STORY_LINES)) {
          lines.forEach((_, i) => {
            const el = headlines.current[chapter + ":" + i];
            if (!el) return;
            const s = storyLineState(chapter, i, glass);
            el.style.opacity = String(s.opacity);
            el.style.translate = `0 0 ${s.z}px`;
            const hidden = s.opacity < 0.02;
            if (el.getAttribute("aria-hidden") !== String(hidden)) el.setAttribute("aria-hidden", String(hidden));
          });
        }
        for (const [key, value] of Object.entries(moduleStats(glass))) {
          const el = metrics.current[key];
          if (!el) continue;
          if (key === "buildOffset") {
            el.style.transform = `translateY(${-value * 1.2}em)`;
            el.parentElement?.parentElement?.setAttribute("aria-label", BUILD_STATES[Math.round(value)]);
          } else if (el.textContent !== value) {
            el.textContent = value;
          }
        }
        const storyEl = tunnelStoryEl.current;
        if (storyEl && page >= 0.55 && page <= 0.94) {
          if (!tunnelYearEl.current) tunnelYearEl.current = storyEl.querySelector("[data-year]");
          if (!tunnelLineEl.current) tunnelLineEl.current = storyEl.querySelector("[data-line]");
          const yearEl = tunnelYearEl.current;
          const lineEl = tunnelLineEl.current;
          const beat = tunnelStory(page);
          const prev = lastTunnel.current;
          if (prev.story !== beat.story) {
            prev.story = beat.story;
            storyEl.style.opacity = String(beat.story);
          }
          if (yearEl && lineEl) {
            if (prev.year !== beat.year) {
              prev.year = beat.year;
              yearEl.textContent = beat.year;
              lineEl.textContent = beat.line;
            }
            if (prev.lineOpacity !== beat.lineOpacity) {
              prev.lineOpacity = beat.lineOpacity;
              yearEl.style.opacity = String(beat.lineOpacity);
              lineEl.style.opacity = String(beat.lineOpacity);
            }
          }
        } else if (storyEl && lastTunnel.current.story !== 0) {
          lastTunnel.current.story = 0;
          storyEl.style.opacity = "0";
        }
        const visible = scene.opacity > 0.02;
        const key = scene.scene + ":" + visible;
        if (entrance) setGlitchToken((token) => token + 1);
        if (uiKey.current !== key) {
          uiKey.current = key;
          setUi({ ...scene, visible });
        }
      },
    }),
    [],
  );

  const inChapter = ui.visible && ["code", "images", "redacted"].includes(ui.scene);
  const go = (event, target) => {
    event.preventDefault();
    if (event.detail > 0) event.currentTarget.blur();
    onNavigate(target);
  };
  const is = (name) => ui.visible && ui.scene === name;

  return (
    <div
      ref={root}
      className={"site-interface" + (inChapter ? " is-chapter" : "") + (ready ? "" : " is-loading")}
      data-ui-scene={ui.scene}
      inert={!ready}
    >
      <SiteHeader footer={ui.scene === "follow"} onLink={go} />
      <HeroSection active={is("hero")} />
      <TunnelSection active={is("tunnel")} storyRef={tunnelStoryEl} />
      <FeaturesSection active={is("features")} />
      <ModuleSection name="code" active={ui.scene === "code"} headlines={headlines} metrics={metrics} />
      <ModuleSection name="images" active={is("images")} headlines={headlines} metrics={metrics} />
      <ModuleSection name="redacted" active={is("redacted")} headlines={headlines} metrics={metrics} />
      <ScaleSection active={is("scale")} />
      <ContactFooter ref={footer} active={ui.scene === "follow" && ui.visible} />
      <ChapterNav visible={inChapter} current={ui.scene} labelRef={navLabel} onLink={go} />
      <nav className="project-index" aria-label="Selected projects">
        {PROJECTS.map((item) => (
          <button key={item.slug} type="button" className="t-nav-mono" onClick={() => onProject(item.slug)}>
            {item.name}
          </button>
        ))}
      </nav>
      <ProjectPanel slug={project} onClose={onCloseProject} onSelect={onProject} />
    </div>
  );
}

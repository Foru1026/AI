import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  BUILD_STATES,
  STORY_LINES,
  interfaceFades,
  moduleStats,
  redactedArrives,
  storyLineState,
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
import { runRedactedGlitch } from "./glitch.js";

export default function SiteInterface({ ref, ready, onNavigate }) {
  const root = useRef(null);
  const metrics = useRef({});
  const headlines = useRef({});
  const navLabel = useRef(null);
  const redactedHeadline = useRef(null);
  const footer = useRef(null);
  const lastGlass = useRef(0);
  const [ui, setUi] = useState({ scene: "hero", visible: true });
  const uiKey = useRef("hero:true");

  useEffect(() => {
    const label = navLabel.current;
    if (
      ui.scene !== "redacted" ||
      !ui.visible ||
      !ui.redactedEntrance ||
      !label ||
      matchMedia(MEDIA.reducedMotion).matches ||
      Number(redactedHeadline.current?.style.opacity ?? 0) < 0.02
    ) {
      return;
    }
    return runRedactedGlitch([label, redactedHeadline.current].filter(Boolean), redactedHeadline.current);
  }, [ui.scene, ui.visible, ui.redactedEntrance]);

  useImperativeHandle(
    ref,
    () => ({
      update(scene, glass, street, journey = 0) {
        const entrance = redactedArrives(lastGlass.current, glass);
        lastGlass.current = glass;
        footer.current?.update(journey);
        root.current?.style.setProperty("--interface-opacity", String(scene.opacity));
        for (const [key, value] of Object.entries(interfaceFades(glass, street))) {
          root.current?.style.setProperty("--ui-" + key, String(value));
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
            el.parentElement.parentElement.setAttribute("aria-label", BUILD_STATES[Math.round(value)]);
          } else if (el.textContent !== value) {
            el.textContent = value;
          }
        }
        const visible = scene.opacity > 0.02;
        const key = scene.scene + ":" + visible;
        if (uiKey.current !== key) {
          uiKey.current = key;
          setUi({ ...scene, visible, redactedEntrance: entrance });
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
      <TunnelSection active={is("tunnel")} />
      <FeaturesSection active={is("features")} />
      <ModuleSection name="code" active={ui.scene === "code"} headlines={headlines} metrics={metrics} />
      <ModuleSection name="images" active={is("images")} headlines={headlines} metrics={metrics} />
      <ModuleSection name="redacted" active={is("redacted")} headlines={headlines} metrics={metrics} glitchRef={redactedHeadline} />
      <ScaleSection active={is("scale")} />
      <ContactFooter ref={footer} active={ui.scene === "follow" && ui.visible} />
      <ChapterNav visible={inChapter} current={ui.scene} labelRef={navLabel} onLink={go} />
    </div>
  );
}

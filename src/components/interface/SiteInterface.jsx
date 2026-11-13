import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  BUILD_STATES,
  STORY_LINES,
  interfaceFades,
  moduleStats,
  redactedArrives,
  storyLineState,
} from "../../lib/timeline.js";
import { ASSETS } from "../../config/assets.ts";
import { MEDIA } from "../../config/breakpoints.ts";
import ContactFooter from "../ContactFooter.jsx";
import { Scene, SceneFades, Reveal } from "./Scene.jsx";
import StoryHeadlines from "./StoryHeadlines.jsx";
import ModuleBar from "./ModuleBar.jsx";
import { runRedactedGlitch } from "./glitch.js";

const CHAPTER_LINKS = [
  ["code", "CODE_GEN"],
  ["images", "IMAGE_GEN"],
  ["redacted", "[REDACTED]"],
];

const MODULES = {
  code: {
    index: "Module 01",
    title: "Writes code at the speed of thought",
    tag: "Full-stack fluent",
    stats: [
      { label: "Lines/sec", metric: "lines", initial: "1" },
      { label: "Lang", metric: "lang", initial: "1" },
      { label: "Build", metric: "build", roll: BUILD_STATES },
    ],
  },
  images: {
    index: "Module 02",
    title: "Renders anything you imagine",
    tag: "Prompt to pixel",
    stats: [
      { label: "Resolution", metric: "resolution", initial: "256 PX" },
      { label: "Generated today", metric: "generated", initial: "0" },
      { label: "Render time", metric: "render", initial: "30.0 S" },
    ],
  },
  redacted: {
    index: "Module 03",
    title: "[REDACTED]",
    tag: "Always watching",
    stats: [
      { label: "Subjects", metric: "subjects", initial: "0" },
      { label: "Blind spots", metric: "blind", initial: "99" },
      { label: "Consent", metric: "consent", initial: "!+?" },
    ],
  },
};

function Callout({ style, index, fragment, lines, children }) {
  return (
    <Reveal className={fragment ? "callout callout--fragment pin" : "callout pin pin--right"} index={index} style={style}>
      <p className="callout__text t-label-mono">
        {lines[0]}
        <br />
        {lines[1]}
      </p>
      {children ?? <span className="callout__line" aria-hidden="true" />}
    </Reveal>
  );
}

function ModuleScene({ name, active, nodes, glitchRef, metrics }) {
  return (
    <Scene name={name} className="scene scene--module" active={active}>
      <div className="scene__stage" />
      <StoryHeadlines chapter={name} nodes={nodes} glitchRef={glitchRef} />
      <SceneFades />
      <ModuleBar {...MODULES[name]} metrics={metrics} />
    </Scene>
  );
}

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
      <header className={"site-header" + (ui.scene === "follow" ? " is-footer" : "")}>
        <a
          hidden={ui.scene === "follow"}
          className="site-header__logo"
          href="#hero"
          aria-label="NODDAL — back to top"
          onClick={(e) => go(e, "hero")}
        >
          <img src={ASSETS.interface.logo} alt="NODDAL" width="138" height="32" />
        </a>
      </header>

      <Scene name="hero" className="scene scene--hero" active={is("hero")}>
        <div className="scene__stage" />
        <SceneFades top={false} />
        <div className="scene__content hero-copy">
          <div className="hero__top">
            <Reveal as="h1" index={0} className="hero__title t-h1 text-gradient-h1">
              Built for compute.
              <br />
              Engineered to scale.
            </Reveal>
            <Reveal as="p" index={1} className="hero__lead t-body">
              NODDAL is next-generation infrastructure for AI coding, image generation and a few other things.
            </Reveal>
          </div>
          <Reveal as="hr" index={2} className="hero__divider" />
          <Reveal index={3} className="hero__facts">
            <p className="hero__fact bullet t-body-light">99.99% uptime SLA</p>
            <span className="hero__sep" aria-hidden="true" />
            <p className="hero__fact bullet t-body-light">Tier III certified</p>
            <span className="hero__sep" aria-hidden="true" />
            <p className="hero__fact bullet t-body-light">24/7 on-site engineers</p>
          </Reveal>
        </div>
      </Scene>

      <Scene name="tunnel" className="scene scene--tunnel" active={is("tunnel")} aria-label="Tunnel">
        <div className="scene__stage" />
        <SceneFades />
      </Scene>

      <Scene name="features" className="scene scene--features" active={is("features")}>
        <div className="scene__stage">
          <Callout
            index={2}
            lines={["NODE_CLUSTER_07", "MODULES: 03 ACTIVE"]}
            style={{
              "--r": "21.34%",
              "--y": "30.69%",
              "--r-t": "25.78%",
              "--y-t": "27.05%",
              "--r-d": "23.33%",
              "--y-d": "15.22%",
              "--line-w": "88px",
              "--line-w-d": "237px",
            }}
          />
          <Callout
            index={3}
            lines={["LOAD 87.42", "LATENCY 0.8 MS"]}
            style={{
              "--r": "14.97%",
              "--y": "53.32%",
              "--r-t": "23.96%",
              "--y-t": "59.77%",
              "--r-d": "25.49%",
              "--y-d": "63.33%",
              "--line-w": "88px",
              "--line-w-d": "194px",
            }}
          />
          <Callout
            index={4}
            fragment
            lines={["FRAGMENT 03/12", "DECOUPLING..."]}
            style={{ "--x": "14.97%", "--y": "54.62%", "--x-t": "17.97%", "--y-t": "46.58%", "--x-d": "15.49%", "--y-d": "38.33%" }}
          >
            <img
              className="callout__connector callout__connector--mobile only-mobile"
              src={ASSETS.interface.connectorMobile}
              alt=""
              width="100"
              height="69"
            />
            <img
              className="callout__connector callout__connector--desktop only-desktop"
              src={ASSETS.interface.connectorDesktop}
              alt=""
              width="217"
              height="73"
            />
          </Callout>
        </div>
        <SceneFades />
        <div className="scene__content scene-text">
          <Reveal as="h2" index={0} className="scene-text__title t-h2 text-gradient-h2">
            Compute power
            <br />
            behind every output
          </Reveal>
          <Reveal as="p" index={1} className="scene-text__tag t-label">
            Real-time processing
          </Reveal>
        </div>
      </Scene>

      <ModuleScene name="code" active={ui.scene === "code"} nodes={headlines} metrics={metrics} />
      <ModuleScene name="images" active={is("images")} nodes={headlines} metrics={metrics} />
      <ModuleScene name="redacted" active={is("redacted")} nodes={headlines} metrics={metrics} glitchRef={redactedHeadline} />

      <Scene name="scale" className="scene scene--scale" active={is("scale")}>
        <div className="scene__stage" />
        <SceneFades />
        <div className="scene__content scene-text">
          <Reveal as="h2" index={0} className="scene-text__title t-h2 text-gradient-h2">
            Infinite compute.
            <br />
            One gateway.
          </Reveal>
          <Reveal index={1} className="portal-caption">
            <p className="scene-text__tag t-label">Power at scale</p>
            <p className="portal-caption__hint">Move your cursor close to the portal to attract lightning</p>
          </Reveal>
        </div>
      </Scene>

      <ContactFooter ref={footer} active={ui.scene === "follow" && ui.visible} />

      <nav className="chapter-nav" aria-label="Generation modules" aria-hidden={!inChapter} inert={!inChapter}>
        <p className="chapter-nav__title t-h1-mono">
          <span className="chapter-nav__marker" aria-hidden="true" />
          Queue:
        </p>
        <ul className="chapter-nav__list">
          {CHAPTER_LINKS.map(([id, label]) => (
            <li key={id}>
              <a
                className={"chapter-nav__item t-nav-mono" + (ui.scene === id ? " is-active" : "")}
                href={"#" + id}
                aria-current={ui.scene === id ? "step" : undefined}
                onClick={(e) => go(e, id)}
              >
                <span className="chapter-nav__marker" aria-hidden="true" />
                {id === "redacted" ? (
                  <span className="chapter-nav__label" ref={navLabel}>
                    {label}
                    <span className="chapter-nav__channel chapter-nav__channel--red" aria-hidden="true">
                      {label}
                    </span>
                    <span className="chapter-nav__channel chapter-nav__channel--blue" aria-hidden="true">
                      {label}
                    </span>
                  </span>
                ) : (
                  label
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

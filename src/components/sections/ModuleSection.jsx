import { BUILD_STATES } from "../../lib/timeline.js";
import { Scene, SceneFades } from "../interface/Scene.jsx";
import StoryHeadlines from "../interface/StoryHeadlines.jsx";
import ModuleBar from "../interface/ModuleBar.jsx";

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

export default function ModuleSection({ name, active, headlines, glitchRef, metrics }) {
  return (
    <Scene name={name} className="scene scene--module" active={active}>
      <div className="scene__stage" />
      <StoryHeadlines chapter={name} nodes={headlines} glitchRef={glitchRef} />
      <SceneFades />
      <ModuleBar {...MODULES[name]} metrics={metrics} />
    </Scene>
  );
}

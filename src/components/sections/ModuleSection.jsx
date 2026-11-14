import { BUILD_STATES } from "../../lib/timeline.js";
import { Scene, SceneFades } from "../interface/Scene.jsx";
import StoryHeadlines from "../interface/StoryHeadlines.jsx";
import ModuleBar from "../interface/ModuleBar.jsx";

const MODULES = {
  code: {
    index: "Module 01",
    title: "Ships full-stack products end to end",
    tag: "React to PostgreSQL",
    stats: [
      { label: "Experience", metric: "years", initial: "1 YR" },
      { label: "Features", metric: "features", initial: "1" },
      { label: "Build", metric: "build", roll: BUILD_STATES },
    ],
  },
  images: {
    index: "Module 02",
    title: "Connects LLMs to real business data",
    tag: "RAG to production",
    stats: [
      { label: "Performance", metric: "performance", initial: "+0%" },
      { label: "Availability", metric: "availability", initial: "90%" },
      { label: "Retrieval", metric: "retrieval", initial: "!@#" },
    ],
  },
  redacted: {
    index: "Module 03",
    title: "AI agents with human-in-the-loop control",
    tag: "Tool calling & MCP",
    stats: [
      { label: "Protocol", metric: "protocol", initial: "!@#" },
      { label: "Unreviewed", metric: "unreviewed", initial: "99" },
      { label: "Approval", metric: "approval", initial: "!@#$" },
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

import { BUILD_STATES } from "../../lib/timeline.js";
import { Scene, SceneFades } from "../interface/Scene.jsx";
import StoryHeadlines from "../interface/StoryHeadlines.jsx";
import ModuleBar from "../interface/ModuleBar.jsx";

const MODULES = {
  code: {
    index: "Module 01",
    title: "9 years shipping production software",
    tag: "React · Node.js · Python · PostgreSQL",
    stats: [
      { label: "Experience", metric: "years", initial: "1 YR" },
      { label: "Features", metric: "features", initial: "1" },
      { label: "Build", metric: "build", roll: BUILD_STATES },
    ],
  },
  images: {
    index: "Module 02",
    title: "Selected work: open any screen for details",
    tag: "AI commerce, agents & SaaS",
    stats: [
      { label: "Performance", metric: "performance", initial: "+0%" },
      { label: "Availability", metric: "availability", initial: "90%" },
      { label: "Retrieval", metric: "retrieval", initial: "!@#" },
    ],
  },
  redacted: {
    index: "Module 03",
    title: "Agents that act, with human approval built in",
    tag: "Tool calling · MCP · Workflow state",
    stats: [
      { label: "Protocol", metric: "protocol", initial: "!@#" },
      { label: "Unreviewed", metric: "unreviewed", initial: "99" },
      { label: "Approval", metric: "approval", initial: "!@#$" },
    ],
  },
};

export default function ModuleSection({ name, active, headlines, metrics }) {
  return (
    <Scene name={name} className="scene scene--module" active={active}>
      <div className="scene__stage" />
      <StoryHeadlines chapter={name} nodes={headlines} />
      <SceneFades />
      <ModuleBar {...MODULES[name]} metrics={metrics} />
    </Scene>
  );
}

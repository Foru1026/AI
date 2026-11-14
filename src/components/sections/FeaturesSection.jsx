import { ASSETS } from "../../config/assets.ts";
import { Scene, SceneFades, Reveal } from "../interface/Scene.jsx";

// Positions are % of the artwork stage; -t = tablet, -d = desktop.
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

export default function FeaturesSection({ active }) {
  return (
    <Scene name="features" className="scene scene--features" active={active}>
      <div className="scene__stage">
        <Callout
          index={2}
          lines={["ENGINEER_09_YRS", "STACKS: 04 ACTIVE"]}
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
          lines={["PERF +35%", "UPTIME 99%+"]}
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
          lines={["AGENT 03/12", "ORCHESTRATING..."]}
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
          Engineering power
          <br />
          behind every product
        </Reveal>
        <Reveal as="p" index={1} className="scene-text__tag t-label">
          End-to-end delivery
        </Reveal>
      </div>
    </Scene>
  );
}

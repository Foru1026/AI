import { Scene } from "../interface/Scene.jsx";

export default function TunnelSection({ active, storyRef }) {
  return (
    <Scene name="tunnel" className="scene scene--tunnel" active={active} aria-label="Tunnel">
      <div className="scene__stage" />
      <div className="tunnel-story" ref={storyRef}>
        <p className="tunnel-story__kicker t-label-mono">How AI moved forward</p>
        <p className="tunnel-story__year t-h1" data-year>
          1950
        </p>
        <p className="tunnel-story__line t-body" data-line>
          A program could follow a proof. Intelligence was still a procedure.
        </p>
      </div>
    </Scene>
  );
}

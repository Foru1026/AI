import { Scene, SceneFades } from "../interface/Scene.jsx";

export default function TunnelSection({ active }) {
  return (
    <Scene name="tunnel" className="scene scene--tunnel" active={active} aria-label="Tunnel">
      <div className="scene__stage" />
      <SceneFades />
    </Scene>
  );
}

import { Scene, SceneFades, Reveal } from "../interface/Scene.jsx";

export default function ScaleSection({ active }) {
  return (
    <Scene name="scale" className="scene scene--scale" active={active}>
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
  );
}

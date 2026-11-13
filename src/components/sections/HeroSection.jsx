import { Scene, SceneFades, Reveal } from "../interface/Scene.jsx";

const FACTS = ["99.99% uptime SLA", "Tier III certified", "24/7 on-site engineers"];

export default function HeroSection({ active }) {
  return (
    <Scene name="hero" className="scene scene--hero" active={active}>
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
          {FACTS.flatMap((fact, i) => [
            ...(i > 0 ? [<span key={fact + ":sep"} className="hero__sep" aria-hidden="true" />] : []),
            <p key={fact} className="hero__fact bullet t-body-light">
              {fact}
            </p>,
          ])}
        </Reveal>
      </div>
    </Scene>
  );
}

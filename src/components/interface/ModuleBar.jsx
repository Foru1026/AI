import { Reveal } from "./Scene.jsx";

// stats: [{ label, metric, initial, roll? }]
export default function ModuleBar({ index, title, tag, stats, metrics }) {
  return (
    <div className="scene__content module-bar">
      <Reveal as="dl" index={0} className="stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.metric}>
            <dt className="stat__label t-small">{stat.label}</dt>
            {stat.roll ? (
              <dd className="stat__value t-label" aria-label={stat.roll[0]}>
                <span className="stat__roll" aria-hidden="true">
                  <span
                    className="stat__roll-track"
                    data-metric={stat.metric}
                    ref={(el) => {
                      metrics.current.buildOffset = el;
                    }}
                  >
                    {stat.roll.map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                  </span>
                </span>
              </dd>
            ) : (
              <dd className="stat__value t-label">
                <span
                  data-metric={stat.metric}
                  ref={(el) => {
                    metrics.current[stat.metric] = el;
                  }}
                >
                  {stat.initial}
                </span>
              </dd>
            )}
          </div>
        ))}
      </Reveal>
      <Reveal as="h2" index={1} className="module-bar__title">
        <span className="module-bar__index t-h2-mono">{index}</span>
        <span className="t-body-mono">{title}</span>
      </Reveal>
      <Reveal as="p" index={2} className="module-bar__tag bullet t-body-light">
        {tag}
      </Reveal>
    </div>
  );
}

import { ABOUT_SCRIPT } from "../../data/aboutScript.js";

function ScriptBlock({ lines, ariaHidden = false }) {
  return (
    <div className="about-script__block" aria-hidden={ariaHidden || undefined}>
      {lines.map((item, i) => {
        const key = `${item.kind}:${item.text ?? item.label ?? "gap"}:${i}`;
        if (item.kind === "gap") return <div key={key} className="about-script__gap" />;
        if (item.kind === "credit") {
          return (
            <p key={key} className="about-script__credit">
              <span className="about-script__credit-label">{item.label}</span>
              <span className="about-script__credit-text">{item.text}</span>
            </p>
          );
        }
        return (
          <p key={key} className={`about-script__${item.kind}`}>
            {item.text}
          </p>
        );
      })}
    </div>
  );
}

export default function AboutScript({ active }) {
  return (
    <div className={`about-script${active ? " is-running" : ""}`} aria-label="About Ben Clark">
      <div className="about-script__viewport">
        <div className="about-script__track">
          <ScriptBlock lines={ABOUT_SCRIPT} />
          <ScriptBlock lines={ABOUT_SCRIPT} ariaHidden />
        </div>
      </div>
    </div>
  );
}

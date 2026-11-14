import { useEffect, useRef, useState } from "react";
import { PROJECTS, projectIndex } from "../../data/projects.js";

const EXIT_MS = 420;
const pad = (n) => String(n).padStart(2, "0");

// Keeps the last project mounted while the exit animation plays.
function usePresence(slug) {
  const [state, setState] = useState({ shown: slug, closing: false });
  if (slug && (state.shown !== slug || state.closing)) setState({ shown: slug, closing: false });
  if (!slug && state.shown && !state.closing) setState({ shown: state.shown, closing: true });
  useEffect(() => {
    if (!state.closing) return;
    const timer = setTimeout(() => setState({ shown: null, closing: false }), EXIT_MS);
    return () => clearTimeout(timer);
  }, [state.closing]);
  return [state.shown, state.closing];
}

export default function ProjectPanel({ slug, onClose, onSelect }) {
  const [shown, closing] = usePresence(slug);
  const root = useRef(null);
  const returnFocus = useRef(null);
  const index = shown ? projectIndex(shown) : -1;
  const project = PROJECTS[index];

  useEffect(() => {
    if (!slug) return;
    returnFocus.current ??= document.activeElement;
    root.current?.focus({ preventScroll: true });
  }, [slug]);
  useEffect(() => {
    if (shown || !returnFocus.current) return;
    returnFocus.current.focus?.({ preventScroll: true });
    returnFocus.current = null;
  }, [shown]);

  useEffect(() => {
    if (!slug) return;
    const step = (dir) => onSelect(PROJECTS[(projectIndex(slug) + dir + PROJECTS.length) % PROJECTS.length].slug);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        const items = [...root.current.querySelectorAll("a[href], button:not(:disabled)")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      } else return;
      e.preventDefault();
    };
    addEventListener("keydown", onKey, true);
    return () => removeEventListener("keydown", onKey, true);
  }, [slug, onClose, onSelect]);

  useEffect(() => {
    root.current?.querySelector(".project-panel__scroll")?.scrollTo(0, 0);
  }, [shown]);

  if (!project) return null;
  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  return (
    <div
      ref={root}
      className={"project-panel" + (closing ? " is-closing" : " is-open")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-panel-title"
      tabIndex={-1}
      data-lenis-prevent
    >
      <div className="project-panel__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="project-panel__scroll">
        <article className="project-panel__inner" key={project.slug}>
          <header className="project-panel__bar" style={{ "--i": 0 }} data-rise>
            <p className="project-panel__count t-h2-mono">
              Project {pad(index + 1)} <span>/ {pad(PROJECTS.length)}</span>
            </p>
            <button type="button" className="project-panel__close t-nav-mono" onClick={onClose}>
              Close <span aria-hidden="true">[esc]</span>
            </button>
          </header>

          <div className="project-panel__grid">
            <figure className="project-panel__media">
              <div className="project-panel__frame project-panel__frame--main">
                <img src={project.shots[0]} alt={`${project.name} — landing screen`} width="1440" height="810" />
              </div>
              <div className="project-panel__frame project-panel__frame--second">
                <img src={project.shots[1]} alt={`${project.name} — product section`} width="1440" height="810" loading="lazy" />
              </div>
            </figure>

            <div className="project-panel__copy">
              <p className="project-panel__category bullet t-body-light" style={{ "--i": 1 }} data-rise>
                {project.category}
              </p>
              <h2 id="project-panel-title" className="project-panel__title t-h1 text-gradient-h1" style={{ "--i": 2 }} data-rise>
                {project.name}
              </h2>
              <p className="project-panel__summary t-body" style={{ "--i": 3 }} data-rise>
                {project.summary}
              </p>
              <dl className="stats project-panel__stats" style={{ "--i": 4 }} data-rise>
                {project.highlights.map(([label, value]) => (
                  <div className="stat" key={label}>
                    <dt className="stat__label t-small">{label}</dt>
                    <dd className="stat__value t-label">{value}</dd>
                  </div>
                ))}
              </dl>
              <section className="project-panel__section" style={{ "--i": 5 }} data-rise>
                <h3 className="t-h2-mono">Engineering focus</h3>
                <ul className="project-panel__focus">
                  {project.focus.map((item) => (
                    <li key={item} className="t-body">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="project-panel__section" style={{ "--i": 6 }} data-rise>
                <h3 className="t-h2-mono">Stack</h3>
                <ul className="project-panel__stack">
                  {project.stack.map((item) => (
                    <li key={item} className="t-body-mono">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
              <a
                className="project-panel__visit t-nav-mono"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ "--i": 7 }}
                data-rise
              >
                Visit live site <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <nav className="project-panel__pager" aria-label="More projects" style={{ "--i": 8 }} data-rise>
            <button type="button" className="project-panel__step" onClick={() => onSelect(prev.slug)}>
              <span className="t-nav-mono">← Prev</span>
              <span className="t-body-light">{prev.name}</span>
            </button>
            <button type="button" className="project-panel__step project-panel__step--next" onClick={() => onSelect(next.slug)}>
              <span className="t-nav-mono">Next →</span>
              <span className="t-body-light">{next.name}</span>
            </button>
          </nav>
        </article>
      </div>
    </div>
  );
}

const CHAPTER_LINKS = [
  ["code", "CODE_GEN"],
  ["images", "IMAGE_GEN"],
  ["redacted", "[REDACTED]"],
];

export default function ChapterNav({ visible, current, labelRef, onLink }) {
  return (
    <nav className="chapter-nav" aria-label="Generation modules" aria-hidden={!visible} inert={!visible}>
      <p className="chapter-nav__title t-h1-mono">
        <span className="chapter-nav__marker" aria-hidden="true" />
        Queue:
      </p>
      <ul className="chapter-nav__list">
        {CHAPTER_LINKS.map(([id, label]) => (
          <li key={id}>
            <a
              className={"chapter-nav__item t-nav-mono" + (current === id ? " is-active" : "")}
              href={"#" + id}
              aria-current={current === id ? "step" : undefined}
              onClick={(e) => onLink(e, id)}
            >
              <span className="chapter-nav__marker" aria-hidden="true" />
              {id === "redacted" ? (
                <span className="chapter-nav__label" ref={labelRef}>
                  {label}
                  <span className="chapter-nav__channel chapter-nav__channel--red" aria-hidden="true">
                    {label}
                  </span>
                  <span className="chapter-nav__channel chapter-nav__channel--blue" aria-hidden="true">
                    {label}
                  </span>
                </span>
              ) : (
                label
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

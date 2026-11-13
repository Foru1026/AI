export function Scene({ name, active, className, children, ...rest }) {
  return (
    <section {...rest} data-scene={name} className={className + (active ? " is-active" : "")} aria-hidden={!active} inert={!active}>
      {children}
    </section>
  );
}

export function SceneFades({ top = true, bottom = true }) {
  return (
    <>
      {top && <div className="scene__fade scene__fade--top" aria-hidden="true" />}
      {bottom && <div className="scene__fade scene__fade--bottom" aria-hidden="true" />}
    </>
  );
}

export function Reveal({ as: Tag = "div", index, className, style, children, ...rest }) {
  return (
    <Tag className={className} data-reveal style={{ "--i": String(index), ...style }} {...rest}>
      {children}
    </Tag>
  );
}

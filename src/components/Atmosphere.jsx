import { useImperativeHandle, useRef } from "react";

const smoothstep = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Atmosphere({ ref }) {
  const el = useRef(null);
  const last = useRef(-1);

  useImperativeHandle(
    ref,
    () => ({
      update(page) {
        const next = 1 - smoothstep(0.28, 0.545, page);
        if (Math.abs(next - last.current) < 0.001) return;
        last.current = next;
        if (el.current) el.current.style.opacity = String(next);
      },
    }),
    [],
  );

  return <div className="atmosphere" ref={el} />;
}

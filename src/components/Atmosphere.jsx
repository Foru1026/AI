import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Atmosphere({ scroll }) {
  const el = useRef();
  useEffect(() => {
    let frame;
    const tick = () => {
      if (el.current) el.current.style.opacity = `${1 - THREE.MathUtils.smoothstep(scroll.current, 0.28, 0.545)}`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scroll]);
  return <div className="atmosphere" ref={el} />;
}

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createTunnelRenderer, tunnelState } from "../webgl/glassTunnel.js";

export default function GlassTunnel({ ref, onReady }) {
  const layer = useRef(null);
  const canvas = useRef(null);
  const renderer = useRef(null);
  const fallbackImage = useRef(null);
  const fallbackGlow = useRef(null);
  const [fallback, setFallback] = useState(false);

  const useFallback = (error) => {
    renderer.current?.dispose();
    renderer.current = null;
    setFallback(true);
    if (error) console.warn("[Glass tunnel] Using the image fallback:", error.message);
  };

  useImperativeHandle(
    ref,
    () => ({
      update(time, page, pointer, speed) {
        const state = tunnelState(page);
        if (layer.current) {
          layer.current.style.opacity = String(state.opacity);
          layer.current.classList.toggle("is-active", state.active);
          layer.current.dataset.active = String(state.active);
        }
        if (state.active) {
          try {
            renderer.current?.render(time, { page, pointer, speed });
          } catch (error) {
            useFallback(error);
          }
        } else {
          renderer.current?.pause();
        }
        if (fallbackImage.current) fallbackImage.current.style.transform = `scale(${1 + state.flight * 7})`;
        if (fallbackGlow.current) fallbackGlow.current.style.opacity = String(state.whiteOut);
      },
    }),
    [],
  );

  useEffect(() => {
    const el = canvas.current;
    let disposed = false;
    const init = () => {
      try {
        renderer.current = createTunnelRenderer(el);
        renderer.current.render(performance.now(), { page: 0.68 });
        renderer.current.pause();
        setFallback(false);
        onReady();
      } catch (error) {
        useFallback(error);
      }
    };
    const onLost = (event) => {
      event.preventDefault();
      useFallback();
    };
    const onRestored = () => {
      if (!disposed) init();
    };
    el.addEventListener("webglcontextlost", onLost);
    el.addEventListener("webglcontextrestored", onRestored);
    init();
    return () => {
      disposed = true;
      el.removeEventListener("webglcontextlost", onLost);
      el.removeEventListener("webglcontextrestored", onRestored);
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [onReady]);

  return (
    <div ref={layer} className="glass-tunnel-layer" aria-hidden="true">
      <canvas ref={canvas} className="glass-tunnel-canvas" hidden={fallback} />
      {fallback && (
        <div className="glass-tunnel-fallback">
          <img ref={fallbackImage} src="/assets/glass-tunnel-fallback.png" alt="" onLoad={onReady} onError={onReady} />
          <div ref={fallbackGlow} className="glass-tunnel-fallback__glow" />
        </div>
      )}
    </div>
  );
}

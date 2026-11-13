import { useEffect, useImperativeHandle, useRef } from "react";
import { HERO_SPLIT, IMAGE_CLOSE } from "../lib/timeline.js";
import { postToFrame, readFrameMessage } from "../bridge/datacluster.ts";
import { ASSETS } from "../config/assets.ts";
import { MEDIA } from "../config/breakpoints.ts";

const HINTS = Object.freeze({
  explore: "Scroll\nto explore",
  down: "Scroll\ndown",
  dive: "Scroll\nto dive",
  default: "",
  active: "",
});
const ROLL = Object.freeze({ height: 22, duration: 420 });

function hintFor(page, glass, journey) {
  if (journey > 0) return "default";
  if (page < HERO_SPLIT) return "explore";
  if (page < 1) return "down";
  return glass >= IMAGE_CLOSE.start ? "dive" : "explore";
}

// Rolls the hint text up to the next state, one transition at a time.
function createHintRoller(track, current, next, isStatic) {
  let shown = "explore";
  let wanted = shown;
  let animation = null;
  let disposed = false;
  current.textContent = HINTS[shown];

  const settle = (state) => {
    shown = state;
    current.textContent = HINTS[state];
    next.textContent = "";
    const running = animation;
    animation = null;
    if (running) {
      running.onfinish = null;
      running.cancel();
    }
  };
  const step = () => {
    if (disposed) return;
    if (isStatic()) {
      settle(wanted);
      return;
    }
    if (wanted === shown || animation) return;
    const target = wanted;
    next.textContent = HINTS[target];
    animation = track.animate([{ transform: "translateY(0)" }, { transform: `translateY(-${ROLL.height}px)` }], {
      duration: ROLL.duration,
      easing: "cubic-bezier(.22, 1, .36, 1)",
      fill: "forwards",
    });
    animation.onfinish = () => {
      settle(target);
      step();
    };
  };
  return {
    update(state) {
      wanted = state;
      step();
    },
    dispose() {
      disposed = true;
      settle(wanted);
    },
  };
}

const toneOf = (el) => (el?.closest?.("[data-cursor-tone]")?.getAttribute("data-cursor-tone") === "dark" ? "dark" : "light");
const isInteractive = (el) =>
  !!el?.closest?.('a[href], button:not(:disabled), [role="button"], input, select, textarea');

export default function CustomCursor({ ref, ready, frame }) {
  const root = useRef(null);
  const track = useRef(null);
  const hint = useRef(null);
  const nextHint = useRef(null);
  const state = useRef("explore");
  const api = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      update(page, glass, journey) {
        const next = hintFor(page, glass, journey);
        if (state.current !== next) {
          state.current = next;
          api.current?.refresh();
        }
      },
    }),
    [],
  );

  useEffect(() => {
    const cursor = root.current;
    const html = document.documentElement;
    const fine = matchMedia(MEDIA.finePointer);
    const reduced = matchMedia(MEDIA.reducedMotion);
    const roller = createHintRoller(track.current, hint.current, nextHint.current, () => reduced.matches || !fine.matches);
    let interactive = false;
    let visible = false;
    let decoded = false;
    let unmounted = false;

    const tellFrame = (value) => postToFrame(frame, { type: "cursor-enabled", value });
    const refresh = () => {
      const next = interactive ? "active" : state.current;
      if (cursor.dataset.state !== next) cursor.dataset.state = next;
      roller.update(next);
    };
    const hide = () => {
      visible = false;
      cursor.dataset.visible = "false";
      html.classList.remove("has-custom-cursor");
      tellFrame(false);
    };
    const show = (x, y, overInteractive, pointerType = "mouse", tone = "light") => {
      if (!ready || !fine.matches || !decoded || pointerType !== "mouse") {
        hide();
        return;
      }
      interactive = overInteractive;
      const t = tone === "dark" ? "dark" : "light";
      if (cursor.dataset.tone !== t) cursor.dataset.tone = t;
      cursor.style.transform = `translate3d(${x - 15}px, ${y - 15}px, 0)`;
      if (!visible) {
        visible = true;
        cursor.dataset.visible = "true";
        html.classList.add("has-custom-cursor");
        tellFrame(true);
      }
      refresh();
    };
    const onMove = (e) => show(e.clientX, e.clientY, isInteractive(e.target), e.pointerType, toneOf(e.target));
    const onOut = (e) => {
      if (e.relatedTarget) {
        show(e.clientX, e.clientY, isInteractive(e.relatedTarget), e.pointerType, toneOf(e.relatedTarget));
      }
    };
    const onMessage = (e) => {
      const message = readFrameMessage(e, frame);
      if (!message) return;
      if (message.type === "ready") {
        tellFrame(visible);
        return;
      }
      if (message.type === "cursor-leave") {
        hide();
        return;
      }
      if (message.type !== "cursor-pointer") return;
      const { x, y, interactive: over, pointerType, tone } = message;
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return;
      const rect = frame.current.getBoundingClientRect();
      show(rect.left + x * rect.width, rect.top + y * rect.height, over === true, pointerType, tone);
    };
    const onVisibility = () => {
      if (document.hidden) hide();
    };
    const onBlur = () => {
      if (document.activeElement !== frame.current) hide();
    };
    const onLeave = (e) => {
      if (!e.relatedTarget) hide();
    };

    api.current = { refresh };
    refresh();
    Promise.all([...cursor.querySelectorAll("img")].map((img) => img.decode()))
      .then(() => {
        if (!unmounted) decoded = true;
      })
      .catch(() => {});
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerover", onMove, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("message", onMessage);
    fine.addEventListener("change", hide);
    reduced.addEventListener("change", refresh);
    return () => {
      unmounted = true;
      api.current = null;
      hide();
      roller.dispose();
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerover", onMove, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("message", onMessage);
      fine.removeEventListener("change", hide);
      reduced.removeEventListener("change", refresh);
    };
  }, [ready, frame]);

  return (
    <div ref={root} className="custom-cursor" data-visible="false" data-state="explore" data-tone="light" aria-hidden="true">
      <div className="custom-cursor__icon">
        <img src={ASSETS.cursor.frame} alt="" width="30" height="30" />
        <span className="custom-cursor__dot" />
        <span className="custom-cursor__inner-dot" />
      </div>
      <div className="custom-cursor__mask">
        <div ref={track} className="custom-cursor__track">
          <span ref={hint} className="custom-cursor__hint">
            {"Scroll\nto explore"}
          </span>
          <span ref={nextHint} className="custom-cursor__hint" />
        </div>
      </div>
    </div>
  );
}

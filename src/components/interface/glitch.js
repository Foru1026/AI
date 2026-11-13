import { STORY_DEPTH } from "../../lib/timeline.js";

const CHANNEL_FRAMES = [
  { transform: "translateX(0)", opacity: 0, clipPath: "inset(0)" },
  { transform: "translateX(9px)", opacity: 0.95, clipPath: "inset(12% 0 58%)", offset: 0.08 },
  { transform: "translateX(-7px)", opacity: 0.8, clipPath: "inset(55% 0 10%)", offset: 0.17 },
  { transform: "translateX(0)", opacity: 0, offset: 0.29 },
  { transform: "translateX(13px)", opacity: 1, clipPath: "inset(30% 0 35%)", offset: 0.44 },
  { transform: "translateX(-10px)", opacity: 0.9, clipPath: "inset(70% 0 2%)", offset: 0.53 },
  { transform: "translateX(0)", opacity: 0, offset: 0.67 },
  { transform: "translateX(5px)", opacity: 0.8, clipPath: "inset(0 0 65%)", offset: 0.81 },
  { transform: "translateX(0)", opacity: 0 },
];

const step = "steps(1, end)";
const TEXT_FRAMES = [
  { transform: "translateX(0) skewX(0)", filter: "brightness(1)" },
  { transform: "translateX(-5px) skewX(-4deg)", filter: "brightness(1.9)", offset: 0.08, easing: step },
  { transform: "translateX(4px) skewX(3deg)", filter: "brightness(1.2)", offset: 0.17, easing: step },
  { transform: "translateX(0) skewX(0)", filter: "brightness(1)", offset: 0.29, easing: step },
  { transform: "translateX(-8px) skewX(-6deg)", filter: "brightness(2.3)", offset: 0.44, easing: step },
  { transform: "translateX(6px) skewX(4deg)", filter: "brightness(1.6)", offset: 0.53, easing: step },
  { transform: "translateX(0) skewX(0)", filter: "brightness(1)", offset: 0.67, easing: step },
  { transform: "translateX(-3px) skewX(-2deg)", filter: "brightness(1.7)", offset: 0.81, easing: step },
  { transform: "translateX(0) skewX(0)", filter: "brightness(1)" },
];

const FLARE_FRAMES = [
  { opacity: 0, transform: "scale(.9)" },
  { opacity: 0.7, transform: "scale(1.06)", offset: 0.1 },
  { opacity: 0.12, transform: "scale(.96)", offset: 0.29 },
  { opacity: 1, transform: "scale(1.12)", offset: 0.45 },
  { opacity: 0.16, transform: "scale(1)", offset: 0.68 },
  { opacity: 0.6, transform: "scale(1.04)", offset: 0.82 },
  { opacity: 0, transform: "scale(1)" },
];

const timing = { duration: 1e3, easing: "linear" };

// Runs the one-second RGB glitch on the [REDACTED] nav label and headline.
// `headline` gets a 3x stronger channel split than the nav label.
export function runRedactedGlitch(targets, headline) {
  const animations = targets.flatMap((el) => {
    el.dataset.glitch = "active";
    const channels = [...el.querySelectorAll(".chapter-nav__channel, .story-headline__channel")];
    const strength = el === headline ? 3 : 1;
    const list = channels.map((channel, i) =>
      channel.animate(
        CHANNEL_FRAMES.map((frame) => ({
          ...frame,
          easing: step,
          transform: frame.transform.replace(/(-?\d+)px/, (_, n) => Number(n) * strength * (i ? -1 : 1) + "px"),
        })),
        timing,
      ),
    );
    const text = el.querySelector(".story-headline__text");
    const flare = el.querySelector(".story-headline__flare");
    const body = el.querySelector(".story-headline__body");
    if (body) {
      list.push(
        body.animate(
          [
            { opacity: 0, transform: `translateZ(${STORY_DEPTH.far}px)` },
            { opacity: 1, transform: "translateZ(0)" },
          ],
          { duration: STORY_DEPTH.arrivalDuration, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        ),
      );
    }
    if (text) list.push(text.animate(TEXT_FRAMES, timing));
    if (flare) list.push(flare.animate(FLARE_FRAMES, timing));
    list[0].onfinish = () => {
      delete el.dataset.glitch;
    };
    return list;
  });
  return () => {
    animations.forEach((a) => a.cancel());
    targets.forEach((el) => {
      delete el.dataset.glitch;
    });
  };
}

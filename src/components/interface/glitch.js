// One-second RGB split on the AI_AGENTS chapter-nav label only.
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
const timing = { duration: 1e3, easing: "linear", fill: "none" };

function clearGlitchStyles(el) {
  if (!el) return;
  delete el.dataset.glitch;
  el.querySelectorAll(".chapter-nav__channel").forEach((node) => {
    node.getAnimations().forEach((animation) => animation.cancel());
    node.style.opacity = "";
    node.style.transform = "";
    node.style.clipPath = "";
  });
}

export function runRedactedGlitch(targets) {
  const live = targets.filter(Boolean);
  const animations = live.flatMap((el) => {
    clearGlitchStyles(el);
    el.dataset.glitch = "active";
    const channels = [...el.querySelectorAll(".chapter-nav__channel")];
    const list = channels.map((channel, i) =>
      channel.animate(
        CHANNEL_FRAMES.map((frame) => ({
          ...frame,
          easing: step,
          transform: frame.transform.replace(/(-?\d+)px/, (_, n) => Number(n) * (i ? -1 : 1) + "px"),
        })),
        timing,
      ),
    );
    const settle = () => clearGlitchStyles(el);
    list.forEach((animation) => {
      animation.onfinish = settle;
      animation.oncancel = settle;
    });
    return list;
  });
  return () => {
    animations.forEach((animation) => animation.cancel());
    live.forEach(clearGlitchStyles);
  };
}

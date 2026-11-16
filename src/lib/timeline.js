// Scroll timeline for the whole experience. Values are in "screens" (viewport heights).

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const smootherstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* ---------- Hero ---------- */

export const HERO_SPLIT = 0.555;
export const HERO_TAIL_STRETCH = 7.2;
export const HERO_SCALE = HERO_SPLIT + (1 - HERO_SPLIT) * HERO_TAIL_STRETCH;
export const CAMERA_START = Object.freeze([0, 0.2, 9]);
export const CAMERA_FOV = 35;
export const FLIGHT_END = 0.475;
export const PORTAL_PHASES = Object.freeze({
  enter: Object.freeze([0.305, 0.35]),
  reveal: Object.freeze([0.565, 0.795]),
  fade: Object.freeze([0.79, 0.885]),
});

export const heroCubeScale = (width, profile) =>
  Math.max(0.43, Math.min(0.6, width / 2200)) * 0.94 * (profile === "desktop" ? 0.9 : 1);
export const coreTargetY = (height) => (height < 700 ? 0.02 : 0.1);

export function portalState(p) {
  return {
    enter: smoothstep(...PORTAL_PHASES.enter, p),
    reveal: smoothstep(...PORTAL_PHASES.reveal, p),
    exitFade: 1 - smoothstep(...PORTAL_PHASES.fade, p),
    active: p > PORTAL_PHASES.enter[0] && p < PORTAL_PHASES.fade[1],
    geometryVisible: p < PORTAL_PHASES.enter[1],
  };
}

export function cameraFlight(p, targetY = 0.1) {
  const t = smoothstep(0.04, FLIGHT_END, p);
  return { x: 0, y: 0.2 + (targetY - 0.2) * t, z: 9 + (0.16 - 9) * t, flight: t };
}

export const heroScreens = (base) => base * HERO_SCALE;
export const heroProgressToScreens = (p, base) =>
  base * (p <= HERO_SPLIT ? p : HERO_SPLIT + (p - HERO_SPLIT) * HERO_TAIL_STRETCH);
export function heroProgress(screens, base) {
  const t = screens / base;
  const p = t <= HERO_SPLIT ? t : HERO_SPLIT + (t - HERO_SPLIT) / HERO_TAIL_STRETCH;
  return clamp01(p);
}

// Page progress where the hero canvas hands off to the tunnel, and where the datacluster iframe takes over.
export const HANDOFF_PAGE = 0.886;
export const CONTINUATION_PAGE = 0.975;

// The corridor in the glass tunnel. Each period holds, fades out, then the next one comes in.
const TUNNEL_BEATS = Object.freeze([
  [
    "1950",
    "Alan Turing asks whether a machine can do what a mind does. The first programs do not converse. They search, they follow a proof, and they play a closed game. Intelligence, here, is still a procedure someone has written down.",
  ],
  [
    "1956",
    "A summer workshop at Dartmouth gives the work its name. The claim is both modest and large: if a problem can be described exactly, a machine might be made to solve it. The years after are spent learning how hard that sentence is.",
  ],
  [
    "1997",
    "Deep Blue beats the world chess champion across a match, not a single game. The machine does not understand the board the way a person does. It searches further, and it does not tire. A public result replaces an argument.",
  ],
  [
    "2012",
    "A network looks at photographs and names what it sees, well enough to change the field. The gain does not come from a cleverer rule. It comes from examples, and from letting the model find the pattern. Vision is the proof. The rest follows.",
  ],
  [
    "2017",
    "A paper shows that attention is enough. A model can weigh one part of a sentence against another, and keep the beginning in mind while it reads the end. Language stops being a bag of words. It becomes something a system can read through.",
  ],
  [
    "2020",
    "Scale turns language into a general tool. One model begins to handle many kinds of work: drafting, answering, summarising. The limit is no longer the idea of language. It is data, compute, and how carefully the model is asked.",
  ],
  [
    "2022",
    "The change people feel is the interface. A person writes a question in ordinary language and receives an answer. The model is still uneven, and it still needs a reader who will check it. For the first time, the work is not reserved for a lab.",
  ],
  [
    "2024",
    "Models reason across longer tasks, see images as well as text, and start to use tools. The work shifts from a single reply to a chain of steps a person can still interrupt. Accuracy becomes a product concern, not only a research one.",
  ],
  [
    "2025",
    "Agents plan, call tools, and stay on a task until a result is ready. Human approval sits in the loop where it matters. Shipping means reliability, cost, and judgment — not only a stronger model.",
  ],
  [
    "2026",
    "AI settles into the stack: search, support, ops, and product surfaces that people already open every day. The question is no longer whether the model can answer. It is whether the system around it is safe, fast, and worth trusting.",
  ],
]);

export function tunnelStory(page) {
  const start = 0.585;
  const end = 0.895;
  const count = TUNNEL_BEATS.length;
  const flight = clamp01((page - start) / (end - start));
  const scaled = flight * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  const local = scaled - index;
  const edge = 0.2;
  const lineOpacity =
    index === count - 1
      ? smoothstep(0, edge, local)
      : smoothstep(0, edge, local) * (1 - smoothstep(1 - edge, 1, local));
  const [year, line] = TUNNEL_BEATS[index];
  const story = smoothstep(start - 0.02, start + 0.025, page) * (1 - smoothstep(end, end + 0.03, page));
  return { story, lineOpacity, year, line };
}

/* ---------- Lenis / scrolling ---------- */

export const LENIS = Object.freeze({ duration: 1.8, wheelMultiplier: 0.85, touchMultiplier: 1 });
export const NAV_DURATION = 2;
export const easeSmooth = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (v) => 1 - Math.pow(1 - clamp01(v), 3);

export function navigateTo(lenis, target) {
  lenis?.scrollTo(target, { programmatic: true, duration: NAV_DURATION, easing: easeSmooth, lerp: 0 });
}

export function cancelReversalFor(lenis, delta) {
  if (
    (lenis.targetScroll - lenis.animatedScroll) * delta < 0 &&
    Math.abs(lenis.targetScroll - lenis.animatedScroll) > 1
  ) {
    lenis.scrollTo(lenis.animatedScroll, { immediate: true });
  }
}

export function scrollBy(lenis, delta, source = "wheel") {
  const d =
    delta *
    (source === "wheel" ? LENIS.wheelMultiplier : source === "touch" ? LENIS.touchMultiplier : 1);
  cancelReversalFor(lenis, d);
  lenis.scrollTo(lenis.targetScroll + d, {
    programmatic: false,
    duration: LENIS.duration,
    easing: easeOutCubic,
    lerp: 0,
  });
}

export function keyScrollDelta(event, viewport, limit, scroll) {
  if (
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.target?.closest?.("input, textarea, select, button, [contenteditable], [data-lenis-prevent]")
  ) {
    return null;
  }
  return (
    {
      ArrowDown: 100,
      ArrowUp: -100,
      PageDown: viewport * 0.85,
      PageUp: -viewport * 0.85,
      " ": viewport * 0.85 * (event.shiftKey ? -1 : 1),
      Home: -scroll,
      End: limit - scroll,
    }[event.key] ?? null
  );
}

/* ---------- Chromatic lens ---------- */

export const LENS = Object.freeze({
  base: 0.7,
  moving: 1.7,
  centre: Object.freeze([0.49, 0.5]),
  channels: Object.freeze([0.8, 0.03, -0.5]),
  distortion: -0.04,
  softness: 0.6,
  falloff: 1.3,
});

const bounded = (v, fallback, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback);

export function normalizeLens(o = {}) {
  const base = bounded(o?.base, LENS.base, 0, 1.5);
  return {
    base,
    moving: bounded(o?.moving, LENS.moving, base, 2),
    centre: LENS.centre.map((v, i) => bounded(o?.centre?.[i], v, 0, 1)),
    channels: LENS.channels.map((v, i) => bounded(o?.channels?.[i], v, -2, 2)),
    distortion: bounded(o?.distortion, LENS.distortion, -0.35, 0.35),
    softness: bounded(o?.softness, LENS.softness, 0, 1),
    falloff: bounded(o?.falloff, LENS.falloff, 0.3, 3),
  };
}

export function lensUniforms(THREE) {
  return {
    uAmount: { value: LENS.base },
    uAspect: { value: 1 },
    uCentre: { value: new THREE.Vector2(...LENS.centre) },
    uChannels: { value: new THREE.Vector3(...LENS.channels) },
    uDistortion: { value: LENS.distortion },
    uSoftness: { value: LENS.softness },
    uFalloff: { value: LENS.falloff },
  };
}

export function applyLens(uniforms, lens, reduced = false) {
  const get = (k) => (uniforms instanceof Map ? uniforms.get(k) : uniforms[k]);
  get("uCentre").value.set(...lens.centre);
  get("uChannels").value.set(...lens.channels);
  get("uDistortion").value = reduced ? 0 : lens.distortion;
  get("uSoftness").value = lens.softness;
  get("uFalloff").value = lens.falloff;
}

export function lensAmount(current, velocity, dt, reduced = false, lens = LENS) {
  const target = reduced ? 0 : lens.base + (lens.moving - lens.base) * Math.min(1, Math.abs(velocity) / 1.2);
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * (target > current ? 14 : 5)));
}

export const LENS_GLSL = `
  uniform vec2 uCentre;
  uniform vec3 uChannels;
  uniform float uDistortion, uSoftness, uFalloff;
  vec4 nodalLens(sampler2D image, vec2 uv, vec4 centreColor, float amount, float aspect) {
    if (amount < .00001 && abs(uDistortion) < .00001) return centreColor;
    vec2 radial = (uv - uCentre)*vec2(aspect, 1.0);
    float radius = length(radial);
    vec2 direction = radial/max(radius, .00001);
    vec2 warped = uCentre + (uv - uCentre)*(1.0 + uDistortion*radius*radius/(1.0 + radius*radius));
    vec2 shift = direction*amount*.02*pow(smoothstep(.02, .9, radius), uFalloff)/vec2(aspect, 1.0);
    vec2 lo = vec2(.0001), hi = vec2(.9999);
    float red = mix(texture2D(image, clamp(warped + shift*uChannels.r, lo, hi)).r,
      texture2D(image, clamp(warped + shift*uChannels.r*.5, lo, hi)).r, uSoftness);
    float green = centreColor.g;
    if (abs(uChannels.g) > .00001 || abs(uDistortion) > .00001) {
      green = mix(texture2D(image, clamp(warped + shift*uChannels.g, lo, hi)).g,
        texture2D(image, clamp(warped + shift*uChannels.g*.5, lo, hi)).g, uSoftness);
    }
    float blue = mix(texture2D(image, clamp(warped + shift*uChannels.b, lo, hi)).b,
      texture2D(image, clamp(warped + shift*uChannels.b*.5, lo, hi)).b, uSoftness);
    return vec4(red, green, blue, centreColor.a);
  }
`;

const OPTICS_KEY = "nodal-optics-v3";
export function loadLens() {
  try {
    return normalizeLens(JSON.parse(localStorage.getItem(OPTICS_KEY) || "{}"));
  } catch {
    return normalizeLens();
  }
}
export function saveLens(lens) {
  try {
    localStorage.setItem(OPTICS_KEY, JSON.stringify(lens));
  } catch {}
}

/* ---------- Glass (datacluster) and journey ---------- */

export const GLASS_SCREENS = 13.4;
export const CALLOUT_RANGE = 0.1;
export const glassProgress = (screens) => clamp01(screens / GLASS_SCREENS);
export const glassChapter = (g) => (g < 0.36 ? "code" : g < 0.7 ? "images" : "tracking");

export const JOURNEY_PORTAL = 4.4;
export const JOURNEY_TAIL = 1.2;
export const JOURNEY_TOTAL = JOURNEY_PORTAL + JOURNEY_TAIL;
export const JOURNEY_SPLIT = JOURNEY_PORTAL / JOURNEY_TOTAL;
export const journeyPortalScreens = (profile = "desktop") =>
  (JOURNEY_PORTAL * (profile === "desktop" ? 2 : 1)) / 3;
export const journeyScreens = (profile) => journeyPortalScreens(profile) + JOURNEY_TAIL;

export function journeyProgress(screens, profile = "desktop") {
  const portal = journeyPortalScreens(profile);
  return clamp01(
    screens <= portal
      ? (screens / portal) * JOURNEY_SPLIT
      : JOURNEY_SPLIT + ((screens - portal) / JOURNEY_TAIL) * (1 - JOURNEY_SPLIT),
  );
}

export function journeyState(v) {
  const p = clamp01(v);
  let index;
  let local;
  let fill = 0;
  let open = 0;
  if (p < JOURNEY_SPLIT) {
    index = 0;
    local = p / JOURNEY_SPLIT;
    fill = smootherstep(0.94, 0.997, local);
  } else {
    index = 1;
    local = (p - JOURNEY_SPLIT) / (1 - JOURNEY_SPLIT);
    fill = 1 - smootherstep(0.28, 0.42, local);
    open = smootherstep(0, 0.38, local);
  }
  return {
    index,
    local,
    fill,
    open,
    blur: index === 1 ? 0 : 0.014 * smootherstep(0.94, 0.975, local) * (1 - smootherstep(0.99, 1, local)),
  };
}

/* ---------- Device ---------- */

export { deviceProfile, currentProfile } from "../config/breakpoints.ts";

/* ---------- Snapping ---------- */

const SNAP_DURATION = 0.85;

export function snapTarget({ profile, baseScreens, page, glass, journeyLocal, pupilCovered, direction, ready, glassReady = true }) {
  if (!ready || !direction) return null;
  const hero = heroScreens(baseScreens);
  const glassEnd = hero + GLASS_SCREENS;
  if (direction > 0) {
    if (profile !== "desktop" && page >= 0.475 && page < 0.58) {
      return { id: "hero-tunnel", screens: heroProgressToScreens(0.6, baseScreens) };
    }
    if (page >= 0.993 && page < 1 && glassReady) return { id: "tunnel-glass", screens: hero + 0.035 };
    if ((journeyLocal === 0 && glass > 0.9 && pupilCovered) || (journeyLocal > 0 && journeyLocal < 0.06)) {
      return { id: "eye-portal", screens: glassEnd + journeyPortalScreens(profile) * 0.065 };
    }
    const tail = ((journeyLocal - 1) * JOURNEY_SPLIT) / (1 - JOURNEY_SPLIT);
    if (journeyLocal >= 0.94 && tail < 0.46) {
      return { id: "portal-footer", screens: glassEnd + journeyPortalScreens(profile) + JOURNEY_TAIL * 0.46 };
    }
  } else {
    const tail = ((journeyLocal - 1) * JOURNEY_SPLIT) / (1 - JOURNEY_SPLIT);
    if (journeyLocal >= 1 && tail < 0.28) {
      return { id: "footer-portal", screens: glassEnd + journeyPortalScreens(profile) * 0.84 };
    }
    if ((journeyLocal > 0 && journeyLocal < 0.055) || (journeyLocal === 0 && glass > 0.945)) {
      return { id: "portal-eye", screens: hero + GLASS_SCREENS * 0.93 };
    }
  }
  return null;
}

export function createSnapper(lenis) {
  let direction = 0;
  let lastGesture = -Infinity;
  let touching = false;
  let active = null;
  const cancel = () => {
    if (active) {
      active = null;
      lenis.scrollTo(lenis.scroll, { immediate: true });
    }
  };
  return {
    gesture(delta, now) {
      if (!Number.isFinite(delta) || delta === 0) return;
      cancel();
      direction = Math.sign(delta);
      lastGesture = now;
    },
    touch(down) {
      touching = down;
      if (down) {
        cancel();
        direction = 0;
      }
    },
    reset() {
      cancel();
      direction = 0;
      touching = false;
    },
    update(state, now) {
      if (active && now >= active.until) active = null;
      if (
        active ||
        touching ||
        now - lastGesture < 100 ||
        (lenis.isScrolling === "native" && Math.abs(lenis.velocity) > 2)
      ) {
        return null;
      }
      const target = snapTarget({ ...state, direction });
      if (!target) return null;
      const px = target.screens * state.unit;
      if ((px - lenis.scroll) * direction <= 1 || (px - lenis.targetScroll) * direction <= 1) return null;
      const duration = state.reduced ? 0.2 : SNAP_DURATION;
      active = { id: target.id, until: now + duration * 1e3 + 250 };
      lenis.scrollTo(px, {
        programmatic: true,
        duration,
        easing: easeSmooth,
        lerp: 0,
        onComplete: () => {
          active = null;
        },
      });
      return target.id;
    },
  };
}

/* ---------- Interface scenes ---------- */

export function sceneFor(page, glass, journey, scaleIntro = 0) {
  if (journey >= JOURNEY_SPLIT) return { scene: "follow", opacity: 1 };
  if (journey > 0) {
    return {
      scene: "scale",
      opacity: clamp01(scaleIntro) * (1 - smoothstep(0.7, 0.83, journey / JOURNEY_SPLIT)),
    };
  }
  if (page < 0.42) return { scene: "hero", opacity: 1 - smoothstep(0.13, 0.32, page) };
  if (page < 0.99) return { scene: "tunnel", opacity: 1 };
  if (glass < 0.14) {
    return { scene: "features", opacity: smoothstep(0.99, 1, page) * (1 - smoothstep(0.115, 0.14, glass)) };
  }
  if (glass < 0.36) return { scene: "code", opacity: smoothstep(0.14, 0.17, glass) };
  if (glass < 0.7) return { scene: "images", opacity: 1 };
  return { scene: "redacted", opacity: 1 - smoothstep(0.88, 0.96, glass) };
}

export function interfaceFades(glass = 0) {
  return {
    callouts: 1 - smoothstep(0.01, CALLOUT_RANGE * 0.9, glass),
  };
}

export function chapterScroll(chapter, baseScreens, unit) {
  const hero = heroScreens(baseScreens);
  if (chapter === "hero") return 0;
  const at = { features: 0.025, code: 0.18, images: 0.4, redacted: 0.76 }[chapter] ?? 0;
  return (hero + GLASS_SCREENS * at) * unit;
}

/* ---------- Story headlines ---------- */

export const IMAGE_CLOSE = Object.freeze({ start: 0.56, end: 0.675 });
export const CHAPTERS = Object.freeze({ code: [0.14, 0.36], images: [0.36, 0.7], redacted: [0.7, 0.88] });
export const BUILD_STATES = Object.freeze(["SCOPED", "BUILT", "TESTED", "SHIPPED", "RUNNING"]);
export const STORY_LINES = Object.freeze({
  code: Object.freeze([
    "First, documents\nbecame data.",
    "Then, workflows\nran themselves.",
    "Agents learned\nto take action.",
    "Now, AI ships\nas product.",
  ]),
  images: Object.freeze([
    "LLMs, wired into\nreal products.",
    "Answers grounded\nin your data.",
    "Fifteen products.\nExplore any screen.",
  ]),
  redacted: Object.freeze(["Some decisions\nstay human."]),
});
// Same shape as STORY_LINES: the small label shown above each headline.
export const STORY_KICKERS = Object.freeze({
  code: Object.freeze([
    "2018–2021 · Affinda · Document AI",
    "2021–2022 · n8n · Workflow automation",
    "2022–2025 · Lindy · AI agents",
    "2025–2026 · Devjam · AI products",
  ]),
  images: Object.freeze(["LLM apps · Structured output", "RAG · Context retrieval", "Selected work · AI SaaS"]),
  redacted: Object.freeze(["Human-in-the-loop · Approval paths"]),
});
const STORY_RANGES = Object.freeze({ ...CHAPTERS, images: [CHAPTERS.images[0], IMAGE_CLOSE.start] });
export const STORY_DEPTH = Object.freeze({ far: -440, near: 140, fadeFraction: 0.1, arrivalDuration: 900 });
const SCRAMBLE = "!@#$%&*?/\\=+<>[]{}";

export function chapterProgress(chapter, glass) {
  const [a, b] = CHAPTERS[chapter];
  return clamp01((glass - a) / (b - a));
}

export function storyLineState(chapter, index, glass) {
  const [a, b] = STORY_RANGES[chapter];
  const p = clamp01((glass - a) / (b - a));
  const count = STORY_LINES[chapter].length;
  if (chapter === "redacted") {
    const out = smoothstep(0, 1, (p - 0.6) / 0.2);
    return { opacity: 1 - out, z: STORY_DEPTH.near * out };
  }
  const local = p * count - index;
  const f = STORY_DEPTH.fadeFraction;
  const inT = smoothstep(0, 1, local / f);
  const outT = smoothstep(0, 1, (local - 1 + f) / f);
  return { opacity: inT * (1 - outT), z: STORY_DEPTH.far * (1 - inT) + STORY_DEPTH.near * outT };
}

export function redactedArrives(prev, next) {
  return prev < CHAPTERS.redacted[0] && next >= CHAPTERS.redacted[0] && storyLineState("redacted", 0, next).opacity >= 0.02;
}

function decodeText(target, v) {
  const p = clamp01(v);
  const shown = Math.floor(p * target.length + 1e-9);
  const tick = Math.floor(p * 45);
  return [...target].map((c, i) => (i < shown ? c : SCRAMBLE[(tick * 7 + i * 11) % SCRAMBLE.length])).join("");
}

function buildOffset(v) {
  const x = clamp01(v) * (BUILD_STATES.length - 1);
  const i = Math.floor(x);
  return i + smoothstep(0, 1, (x - i - 0.65) / 0.35);
}

export function moduleStats(glass) {
  const code = chapterProgress("code", glass);
  const images = chapterProgress("images", glass);
  const redacted = chapterProgress("redacted", glass);
  const years = Math.round(1 + 8 * code);
  const features = Math.round(1 + 14 * code);
  const speedup = Math.round(35 * images);
  const availability = Math.round(90 + 9 * images);
  return {
    years: years + (years === 1 ? " YR" : " YRS"),
    features: features + (features === 15 ? "+" : ""),
    buildOffset: buildOffset(code),
    performance: "+" + speedup + "%",
    availability: availability + (availability === 99 ? "%+" : "%"),
    retrieval: decodeText("RAG", images),
    protocol: decodeText("MCP", redacted),
    unreviewed: String(Math.round(99 * (1 - redacted))),
    approval: decodeText("HITL", redacted),
  };
}

/* ---------- Footer reveal ---------- */

const FOOTER_SLIDE_START = 0.46;

export function footerState(journey, width, height, contentHeight) {
  const s = journeyState(journey);
  const active = s.index === 1;
  const overflow = Math.max(0, contentHeight - height);
  const offset = active ? overflow * clamp01((s.local - FOOTER_SLIDE_START) / (1 - FOOTER_SLIDE_START)) : 0;
  const radius = s.open * (Math.hypot(width, height) * 0.55 + height * 0.2);
  return {
    active,
    interactive: active && s.fill <= 0.001,
    offset,
    mask:
      active && s.fill <= 0.001
        ? "none"
        : `radial-gradient(circle at 50% 50%, #000 ${Math.max(0, radius - height * 0.12)}px, transparent ${Math.max(0, radius - height * 0.04)}px)`,
  };
}

export const FOOTER_REVEAL_DURATION = 750;
export const FOOTER_REVEAL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const FOOTER_DELAYS = Object.freeze({
  brand: 0,
  "top-meta": 120,
  "proposal-eyebrow": 200,
  "proposal-title": 260,
  "proposal-description": 320,
  "field-name": 420,
  "field-phone": 420,
  "field-email": 520,
  submit: 520,
  "channels-title": 300,
  "channel-0": 380,
  "channel-1": 440,
  "channel-2": 500,
  "channel-3": 560,
  "channel-4": 620,
  credit: 820,
  legal: 880,
});

export function footerDelay(key, width) {
  if (width < 1024) {
    const stacked = {
      "field-phone": 620,
      submit: 720,
      "channels-title": 820,
      "channel-0": 880,
      "channel-1": 940,
      "channel-2": 1000,
      "channel-3": 1060,
      "channel-4": 1120,
      credit: 1260,
      legal: 1320,
    };
    if (key in stacked) return stacked[key];
  }
  return FOOTER_DELAYS[key] ?? 0;
}

const FOOTER_SEEN_KEY = "noddal:footer-entered:v1";
export function footerMemory(storage) {
  let seen = false;
  try {
    if (storage === undefined) storage = window.sessionStorage;
    seen = storage?.getItem(FOOTER_SEEN_KEY) === "true";
  } catch {
    storage = null;
  }
  let instant = seen;
  return {
    update(interactive) {
      if (interactive && !seen) {
        seen = true;
        try {
          storage?.setItem(FOOTER_SEEN_KEY, "true");
        } catch {}
      } else if (!interactive && seen) {
        instant = true;
      }
      return { revealed: seen, instant };
    },
  };
}

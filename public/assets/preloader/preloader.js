/*!
 * NODDAL preloader — vanilla JS, no dependencies.
 * The ring and the percentage follow the real loading progress of the page:
 * document + fonts + <img>/<video>, Three.js LoadingManager items, fetches with
 * byte-level progress, and any custom tasks/holds you register.
 *
 * Put <div id="noddal-preloader"></div> as the first element of <body>,
 * and load this script (synchronously) right after it.
 */
(function (window, document) {
  "use strict";
  if (window.NoddalPreloader) return;

  /* ------------------------------------------------------------------ config */

  var cfg = {
    manual: false, // true → waits for NoddalPreloader.ready() (recommended for WebGL scenes)
    autoTrack: true, // track document, fonts, <img>, <video> automatically
    fillTime: 1.1, // s — fastest possible full-ring fill (so cached loads still animate)
    hold: 380, // ms — hold the full ring before exit
    settle: 250, // ms — everything must stay idle this long (catches late-registered assets)
    maxWait: 45000, // ms — safety valve: reveal the site anyway (0 = never)
    status: "[loading status]",
    lockScroll: true,
    remove: true, // remove the node from the DOM when finished
  };
  var user = window.NODDAL_PRELOADER || {};
  for (var key in user)
    if (Object.prototype.hasOwnProperty.call(user, key)) cfg[key] = user[key];

  var reduced = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  var now = function () {
    return window.performance && performance.now
      ? performance.now()
      : Date.now();
  };
  var clamp01 = function (v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  };
  var rand = function (a, b) {
    return a + Math.random() * (b - a);
  };

  /* ------------------------------------------------------------- progress core */

  var tasks = [];
  var lastAddAt = now();
  var t0 = now();

  function task(label, weight) {
    var t = {
      label: label || "task",
      w: weight == null ? 1 : Math.max(0, +weight || 0),
      f: 0,
      done: false,
    };
    tasks.push(t);
    lastAddAt = now();
    settled = false;
    fullAt = 0;
    var h = {
      progress: function (f) {
        if (!t.done) t.f = Math.max(t.f, clamp01(+f || 0));
        return h;
      },
      done: function () {
        if (!t.done) {
          t.f = 1;
          t.done = true;
        }
        return h;
      },
      fail: function (err) {
        if (!t.done) {
          t.f = 1;
          t.done = true;
          if (window.console)
            console.warn("[noddal-preloader] failed:", t.label, err || "");
        }
        return h;
      },
    };
    return h;
  }

  function target() {
    var W = 0,
      S = 0;
    for (var i = 0; i < tasks.length; i++) {
      W += tasks[i].w;
      S += tasks[i].w * tasks[i].f;
    }
    return W > 0 ? S / W : allDone() ? 1 : 0;
  }
  function allDone() {
    for (var i = 0; i < tasks.length; i++) if (!tasks[i].done) return false;
    return true;
  }
  function pending() {
    return tasks
      .filter(function (t) {
        return !t.done;
      })
      .map(function (t) {
        return t.label;
      });
  }

  function track(promise, o) {
    o = o || {};
    var h = task(o.label, o.weight);
    Promise.resolve(promise).then(
      function () {
        h.done();
      },
      function (e) {
        h.fail(e);
      },
    );
    return promise;
  }

  function hold(label, weight) {
    var h = task(label || "hold", weight);
    return function release() {
      h.done();
    };
  }

  /* fetch with real byte progress */
  function fetchAsset(url, o) {
    o = o || {};
    var h = task(o.label || String(url), o.weight);
    return window
      .fetch(url, o.init)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + " " + url);
        var total = +res.headers.get("content-length") || +o.size || 0;
        var type = res.headers.get("content-type") || "";
        if (!res.body || !res.body.getReader || !total) return res.blob();
        var reader = res.body.getReader(),
          chunks = [],
          got = 0;
        return (function pump() {
          return reader.read().then(function (r) {
            if (r.done) return new Blob(chunks, { type: type });
            chunks.push(r.value);
            got += r.value.length;
            h.progress(got / total);
            return pump();
          });
        })();
      })
      .then(
        function (blob) {
          h.done();
          switch (o.as || "blob") {
            case "arrayBuffer":
              return blob.arrayBuffer();
            case "json":
              return blob.text().then(JSON.parse);
            case "text":
              return blob.text();
            case "url":
              return URL.createObjectURL(blob);
            default:
              return blob;
          }
        },
        function (e) {
          h.fail(e);
          throw e;
        },
      );
  }

  /* Three.js LoadingManager (THREE.DefaultLoadingManager or your own) */
  function three(manager, o) {
    o = o || {};
    manager = manager || (window.THREE && window.THREE.DefaultLoadingManager);
    if (!manager || manager.__noddalPreloader) return manager;
    manager.__noddalPreloader = true;
    var w = o.weight == null ? 1 : o.weight;
    var open = {},
      swallowEnd = {};
    var start = manager.itemStart,
      end = manager.itemEnd,
      err = manager.itemError;
    function close(url, failed) {
      var list = open[url],
        h = list && list.shift();
      if (h) failed ? h.fail(url) : h.done();
      if (list && !list.length) delete open[url];
    }
    manager.itemStart = function (url) {
      (open[url] || (open[url] = [])).push(task(url, w));
      return start.apply(this, arguments);
    };
    manager.itemError = function (url) {
      close(url, true);
      swallowEnd[url] = (swallowEnd[url] || 0) + 1; // three calls itemEnd right after itemError
      return err.apply(this, arguments);
    };
    manager.itemEnd = function (url) {
      if (swallowEnd[url]) {
        swallowEnd[url]--;
      } else close(url);
      return end.apply(this, arguments);
    };
    return manager;
  }

  /* automatic tracking of the document itself */
  var seen = typeof WeakSet === "function" ? new WeakSet() : null;
  var observer = null;

  function trackMedia(el) {
    if (!el || el.nodeType !== 1) return;
    if (seen) {
      if (seen.has(el)) return;
      seen.add(el);
    }
    if (
      el.closest &&
      (el.closest("#noddal-preloader") || el.closest("[data-np-ignore]"))
    )
      return;
    var weight = el.getAttribute("data-np-weight");
    weight = weight == null ? 1 : +weight;

    if (el.tagName === "IMG") {
      if (el.complete || el.loading === "lazy") return;
      var hi = task("img " + (el.currentSrc || el.src), weight);
      el.addEventListener(
        "load",
        function () {
          hi.done();
        },
        { once: true },
      );
      el.addEventListener(
        "error",
        function () {
          hi.fail(el.src);
        },
        { once: true },
      );
    } else if (el.tagName === "VIDEO") {
      if (el.readyState >= 2) return;
      if (el.preload === "none" && !el.autoplay) return;
      var hv = task("video " + (el.currentSrc || el.src), weight);
      var ok = function () {
        hv.done();
      };
      el.addEventListener("loadeddata", ok, { once: true });
      el.addEventListener(
        "error",
        function () {
          hv.fail(el.src);
        },
        { once: true },
      );
      setTimeout(ok, 10000); // mobile data-saver may never load it — don't block forever
    }
  }

  function scanMedia(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.tagName === "IMG" || root.tagName === "VIDEO") trackMedia(root);
    var list = root.querySelectorAll("img, video");
    for (var i = 0; i < list.length; i++) trackMedia(list[i]);
  }

  function autoTrack() {
    var doc = task("document", 2);
    function rs() {
      if (document.readyState === "interactive") doc.progress(0.5);
      if (document.readyState === "complete") doc.done();
    }
    rs();
    document.addEventListener("readystatechange", rs);
    window.addEventListener(
      "load",
      function () {
        doc.done();
      },
      { once: true },
    );

    if (document.fonts && document.fonts.ready)
      track(document.fonts.ready, { label: "fonts", weight: 0.5 });

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          scanMedia(document);
        },
        { once: true },
      );
    } else scanMedia(document);

    if (window.MutationObserver) {
      observer = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) scanMedia(added[j]);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  /* manual mode */
  var appRelease = null,
    readyCalled = false;
  function enableManual() {
    if (appRelease || readyCalled) return;
    appRelease = hold(
      "app (NoddalPreloader.ready)",
      cfg.appWeight == null ? 1 : cfg.appWeight,
    );
  }
  function ready() {
    readyCalled = true;
    if (appRelease) appRelease();
  }

  if (cfg.autoTrack) autoTrack();
  if (cfg.manual) enableManual();
  if (cfg.lockScroll) document.documentElement.classList.add("np-lock");

  /* ------------------------------------------------------------------- view */

  var LOGO =
    '<svg class="np__logo" viewBox="0 0 88 32" aria-hidden="true" focusable="false">' +
    '<g class="np__icon">' +
    '<path d="M13.6204 1.57146C14.3823 0.809514 15.6177 0.809514 16.3796 1.57146L20.8059 5.99774C21.5679 6.75969 21.5679 7.99504 20.8059 8.75699L7.75699 21.8059C6.99504 22.5679 5.75969 22.5679 4.99774 21.8059L0.571458 17.3796C-0.190486 16.6177 -0.190486 15.3823 0.571458 14.6204L13.6204 1.57146Z"/>' +
    '<path d="M22.243 10.1941C23.005 9.43215 24.2403 9.43215 25.0023 10.1941L29.4285 14.6204C30.1905 15.3823 30.1905 16.6177 29.4285 17.3796L25.0023 21.8059C24.2403 22.5679 23.005 22.5679 22.243 21.8059L17.8167 17.3796C17.0548 16.6177 17.0548 15.3823 17.8167 14.6204L22.243 10.1941Z"/>' +
    '<path d="M13.6204 18.8167C14.3823 18.0548 15.6177 18.0548 16.3796 18.8167L20.8059 23.243C21.5679 24.005 21.5679 25.2403 20.8059 26.0023L16.3796 30.4285C15.6177 31.1905 14.3823 31.1905 13.6204 30.4285L9.19409 26.0023C8.43215 25.2403 8.43215 24.005 9.19409 23.243L13.6204 18.8167Z"/>' +
    "</g>" +
    /* 4 */ '<text class="np__l" x="38" y="22.8" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="16" font-weight="500" letter-spacing="0.06em">4</text>' +
    /* U */ '<text class="np__l" x="50" y="22.8" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="16" font-weight="500" letter-spacing="0.06em">U</text>' +
    "</svg>";

  var MARKUP =
    '<div class="np__stage">' +
    '<svg class="np__ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<circle class="np__arc" cx="50" cy="50" r="49.5" pathLength="100" transform="rotate(-90 50 50)"/>' +
    "</svg>" +
    LOGO +
    "</div>" +
    '<div class="np__meta">' +
    '<div class="np__status"></div>' +
    '<div class="np__pct"><span class="np__num">00</span>%</div>' +
    "</div>";

  /* Choreography is written in 25fps "frames", like the source video (1 frame = 40ms). */
  var FRAME = 40;
  var INTRO_FRAMES = reduced ? 12 : 38; // letters (0–17) → icon + ring glitch (18–37) → steady
  // Logo keeps its 1s fade; ring/meta keep their 1.5s animation. Start the
  // black fade after 1s of ring travel (1.5x sooner), overlapping its tail.
  var REVEAL_START_MS = reduced ? 240 : 2000;
  var INTRO_CAP = 0.6; // progress shown during the intro never runs ahead of it

  var LETTER_COUNT = 2;
  function allLetters(value) {
    var out = [];
    for (var n = 0; n < LETTER_COUNT; n++) out.push(value);
    return out;
  }

  function buildIntro() {
    var frames = [],
      f,
      i;
    if (reduced) {
      for (f = 0; f < INTRO_FRAMES; f++) {
        frames.push({
          logo: Math.min(1, f / (INTRO_FRAMES - 2)),
          icon: 1,
          letters: allLetters(1),
          arc: "progress",
        });
      }
      return frames;
    }
    // letters pop in shuffled, each with its own little flicker
    var order = [1, 0],
      starts = [2, 5];
    var patterns = [
      [0.3, 1, 0, 1],
      [0.35, 0, 1, 0.5, 1],
      [1, 0, 0.3, 1],
      [0.3, 0.6, 0, 1, 1],
      [0.4, 1, 1, 0, 1],
    ];
    var letterOp = allLetters(0).map(function () {
      return [];
    });
    order.forEach(function (li, k) {
      var p = patterns[(Math.random() * patterns.length) | 0];
      for (var fr = 0; fr < INTRO_FRAMES; fr++) {
        var j = fr - starts[k];
        letterOp[li][fr] = j < 0 ? 0 : j < p.length ? p[j] : 1;
      }
    });
    var spin = rand(0, 360);
    for (f = 0; f < INTRO_FRAMES; f++) {
      var s = {
        logo: 1,
        icon: 0,
        letters: letterOp.map(function (a) {
          return a[f];
        }),
        arc: null,
      };
      if (f === 18) {
        s.icon = 1;
        s.arc = { rot: spin, len: 0.72 };
      } else if (f > 18 && f < 32) {
        if (Math.random() < 0.12) {
          s.letters = allLetters(0);
        } else {
          s.icon = Math.random() < 0.75 ? 1 : 0;
          var wordOn = Math.random() < 0.72;
          s.letters = s.letters.map(function () {
            return wordOn ? (Math.random() < 0.18 ? 0 : 1) : 0;
          });
          if (Math.random() < 0.82)
            s.arc = {
              rot: spin + (f - 18) * 26 + rand(-35, 35),
              len: rand(0.45, 0.78),
            };
        }
      } else if (f >= 32) {
        // 32 blank · 33 full · 34–35 blank · 36–37 half-bright → steady
        var k2 = f - 32;
        if (k2 === 0 || k2 === 2 || k2 === 3) {
          s.letters = allLetters(0);
        } else {
          s.icon = 1;
          s.letters = allLetters(1);
          s.arc = "progress";
          s.logo = k2 >= 4 ? 0.5 : 1;
        }
      }
      frames.push(s);
    }
    return frames;
  }

  var resizeObs = null;
  var root, arcEl, logoEl, iconEl, letterEls, numEl, statusEl;
  var introFrames = buildIntro();
  var phase = "idle",
    phaseStart = 0,
    fullAt = 0,
    idleSince = 0,
    settled = false;
  var disp = 0,
    goal = 0,
    last = 0,
    lastPct = -1,
    lastFrameKey = "";
  var resolveReveal, resolveComplete;
  var revealed = new Promise(function (r) {
    resolveReveal = r;
  });
  var completed = new Promise(function (r) {
    resolveComplete = r;
  });

  function emit(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("noddal:" + name, { detail: detail }),
      );
    } catch (e) {
      /* old browsers */
    }
  }

  function attach() {
    if (root) return;
    root = document.getElementById("noddal-preloader");
    if (!root) {
      root = document.createElement("div");
      root.id = "noddal-preloader";
      document.body.insertBefore(root, document.body.firstChild);
    }
    if (!root.querySelector(".np__stage")) root.innerHTML = MARKUP;
    if (root.hasAttribute("data-manual")) enableManual();
    if (root.getAttribute("data-status"))
      cfg.status = root.getAttribute("data-status");

    root.setAttribute("role", "progressbar");
    root.setAttribute("aria-label", "Loading");
    root.setAttribute("aria-valuemin", "0");
    root.setAttribute("aria-valuemax", "100");

    arcEl = root.querySelector(".np__arc");
    logoEl = root.querySelector(".np__logo");
    iconEl = root.querySelector(".np__icon");
    letterEls = root.querySelectorAll(".np__l");
    numEl = root.querySelector(".np__num");
    statusEl = root.querySelector(".np__status");
    statusEl.textContent = cfg.status;

    // 1px border at any ring size (viewBox is 100 units wide)
    var ringEl = root.querySelector(".np__ring");
    var fitStroke = function () {
      var w = ringEl.getBoundingClientRect().width;
      if (w) arcEl.style.strokeWidth = (100 / w).toFixed(4);
    };
    fitStroke();
    if (window.ResizeObserver) {
      resizeObs = new ResizeObserver(fitStroke);
      resizeObs.observe(ringEl);
    } else window.addEventListener("resize", fitStroke);

    phase = "intro";
    root.dataset.phase = phase;
    phaseStart = last = now();
    requestAnimationFrame(loop);
  }

  function setArc(arc) {
    if (!arc) {
      arcEl.style.strokeDasharray = "0 100";
    } else if (arc === "progress") {
      arcEl.setAttribute("transform", "rotate(0 50 50)");
      arcEl.style.strokeDasharray =
        disp >= 0.9995 ? "none" : (disp * 100).toFixed(3) + " 100";
    } else {
      arcEl.setAttribute(
        "transform",
        "rotate(" + (arc.rot - 90).toFixed(2) + " 50 50)",
      );
      arcEl.style.strokeDasharray = (arc.len * 100).toFixed(3) + " 100";
    }
  }

  function applyFrame(s, key) {
    if (key === lastFrameKey && s.arc !== "progress") return;
    lastFrameKey = key;
    logoEl.style.opacity = s.logo;
    iconEl.style.opacity = s.icon;
    for (var i = 0; i < letterEls.length; i++)
      letterEls[i].style.opacity = s.letters[i];
    setArc(s.arc);
  }

  var STEADY = {
    logo: 1,
    icon: 1,
    letters: allLetters(1),
    arc: "progress",
  };

  function updateProgress(t, dt) {
    // completion = every task finished, document loaded, and nothing new registered for `settle` ms
    var idle = allDone() && document.readyState === "complete";
    if (idle) {
      if (!idleSince) idleSince = t;
    } else idleSince = 0;
    if (
      !settled &&
      idle &&
      t - idleSince >= cfg.settle &&
      t - lastAddAt >= cfg.settle
    )
      settled = true;
    if (!settled && cfg.maxWait && t - t0 > cfg.maxWait) {
      settled = true;
      if (window.console)
        console.warn(
          "[noddal-preloader] maxWait reached, still pending:",
          pending(),
        );
    }

    var real = settled ? 1 : Math.min(target(), 0.99);
    if (phase === "intro")
      real = Math.min(
        real,
        INTRO_CAP * Math.min(1, (t - phaseStart) / (INTRO_FRAMES * FRAME)),
      );
    goal = Math.max(goal, real); // never goes backwards, even when new assets get discovered

    var gap = goal - disp;
    if (gap > 0) {
      var step = gap * (1 - Math.exp(-dt * 5)); // ease toward the real value
      step = Math.max(step, Math.min(gap, dt * 0.3)); // …without crawling at the very end
      step = Math.min(step, dt / cfg.fillTime); // …and never faster than fillTime
      disp += step;
      if (goal - disp < 1e-4) disp = goal;
    }

    var pct = disp >= 0.9995 ? 100 : Math.min(99, Math.floor(disp * 100));
    if (pct !== lastPct) {
      lastPct = pct;
      numEl.textContent = pct < 10 ? "0" + pct : String(pct);
      root.setAttribute("aria-valuenow", String(pct));
      emit("progress", { progress: disp, percent: pct });
    }
  }

  function loop() {
    var t = now();
    var dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    updateProgress(t, dt);

    var f = Math.floor((t - phaseStart) / FRAME);

    if (phase === "intro") {
      if (f < INTRO_FRAMES) applyFrame(introFrames[f], "i" + f);
      else {
        phase = "steady";
        phaseStart = t;
        root.dataset.phase = phase;
      }
    }
    if (phase === "steady") {
      applyFrame(STEADY, "steady");
      if (settled && disp >= 1) {
        if (!fullAt) fullAt = t;
        if (t - fullAt >= cfg.hold) {
          phase = "exit";
          phaseStart = t;
          root.dataset.phase = phase;
          root.classList.add("is-exiting");
          // Prepare hero UI while the background is still completely black.
          emit("exit");
        }
      }
    }
    if (phase === "exit") {
      if (t - phaseStart >= REVEAL_START_MS) {
        reveal();
        return;
      }
    }
    requestAnimationFrame(loop);
  }

  function reveal() {
    phase = "reveal";
    root.dataset.phase = phase;
    root.classList.add("is-out");
    if (observer) observer.disconnect();
    if (resizeObs) resizeObs.disconnect();
    emit("reveal");
    resolveReveal();

    var fade =
      parseFloat(getComputedStyle(root).getPropertyValue("--np-fade")) || 600;
    setTimeout(function () {
      phase = "done";
      if (cfg.lockScroll) document.documentElement.classList.remove("np-lock");
      var app = document.getElementById("root");
      if (app) app.removeAttribute("inert");
      if (cfg.remove && root.parentNode) root.parentNode.removeChild(root);
      emit("complete");
      resolveComplete();
    }, fade + 40);
  }

  /* -------------------------------------------------------------------- API */

  window.NoddalPreloader = {
    /** custom task: const t = task('label', weight); t.progress(0.4); t.done(); */
    task: task,
    /** track any promise: NoddalPreloader.track(somePromise, { label, weight }) */
    track: track,
    /** fetch with byte-level progress → Blob / ArrayBuffer / json / text / object URL */
    fetch: fetchAsset,
    /** hook a THREE.LoadingManager (defaults to THREE.DefaultLoadingManager) */
    three: three,
    /** block completion until release() is called: const release = hold('shaders') */
    hold: hold,
    /** manual mode: call when the scene is compiled & the first frame is rendered */
    ready: ready,
    setStatus: function (text) {
      cfg.status = text;
      if (statusEl) statusEl.textContent = text;
    },
    get progress() {
      return disp;
    },
    get phase() {
      return phase;
    },
    get pending() {
      return pending();
    },
    revealed: revealed, // resolves when the overlay starts fading out
    completed: completed, // resolves when the overlay is gone
    config: cfg,
  };

  if (document.body) attach();
  else document.addEventListener("DOMContentLoaded", attach, { once: true });
})(window, document);

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
    '<svg class="np__logo" viewBox="0 0 139 32" aria-hidden="true" focusable="false">' +
    '<g class="np__icon">' +
    '<path d="M13.6204 1.57146C14.3823 0.809514 15.6177 0.809514 16.3796 1.57146L20.8059 5.99774C21.5679 6.75969 21.5679 7.99504 20.8059 8.75699L7.75699 21.8059C6.99504 22.5679 5.75969 22.5679 4.99774 21.8059L0.571458 17.3796C-0.190486 16.6177 -0.190486 15.3823 0.571458 14.6204L13.6204 1.57146Z"/>' +
    '<path d="M22.243 10.1941C23.005 9.43215 24.2403 9.43215 25.0023 10.1941L29.4285 14.6204C30.1905 15.3823 30.1905 16.6177 29.4285 17.3796L25.0023 21.8059C24.2403 22.5679 23.005 22.5679 22.243 21.8059L17.8167 17.3796C17.0548 16.6177 17.0548 15.3823 17.8167 14.6204L22.243 10.1941Z"/>' +
    '<path d="M13.6204 18.8167C14.3823 18.0548 15.6177 18.0548 16.3796 18.8167L20.8059 23.243C21.5679 24.005 21.5679 25.2403 20.8059 26.0023L16.3796 30.4285C15.6177 31.1905 14.3823 31.1905 13.6204 30.4285L9.19409 26.0023C8.43215 25.2403 8.43215 24.005 9.19409 23.243L13.6204 18.8167Z"/>' +
    "</g>" +
    /* N */ '<path class="np__l" d="M42.0861 7.25L50.1314 17.6L52.5678 20.65H52.644L52.6186 17.625V7.25H55.6895V24.75H51.7811L41.1471 11.025H41.0709V24.75H38V7.25H42.0861Z"/>' +
    /* O */ '<path class="np__l" d="M60.265 9.4C62.1092 7.8 64.571 7 67.6504 7C70.7467 7 73.2085 7.8 75.0359 9.4C76.8801 11 77.8022 13.2083 77.8022 16.025C77.8022 18.8417 76.8801 21.0417 75.0359 22.625C73.1916 24.2083 70.7298 25 67.6504 25C64.5541 25 62.0838 24.2083 60.2396 22.625C58.4123 21.025 57.4986 18.825 57.4986 16.025C57.4986 13.2083 58.4207 11 60.265 9.4ZM62.3969 20.8C63.5136 21.75 65.2647 22.225 67.6504 22.225C70.0022 22.225 71.745 21.7167 72.8786 20.7C74.0291 19.6833 74.6044 18.1167 74.6044 16C74.6044 13.7833 74.0376 12.1917 72.904 11.225C71.7704 10.2583 70.0192 9.775 67.6504 9.775C65.2647 9.775 63.5051 10.2583 62.3715 11.225C61.2548 12.1917 60.6964 13.7833 60.6964 16C60.6964 18.25 61.2632 19.85 62.3969 20.8Z"/>' +
    /* D */ '<path class="np__l" d="M88.4262 7.25C91.3364 7.25 93.5952 8.03333 95.2025 9.6C96.8099 11.15 97.6136 13.2833 97.6136 16C97.6136 18.7167 96.8015 20.8583 95.1772 22.425C93.5698 23.975 91.3195 24.75 88.4262 24.75H79.5434V7.25H88.4262ZM82.6397 10.05V21.925H88.3501C90.5158 21.925 92.0724 21.4667 93.0199 20.55C93.9674 19.6167 94.4412 18.1 94.4412 16C94.4412 13.9 93.959 12.3833 92.9945 11.45C92.047 10.5167 90.4989 10.05 88.3501 10.05H82.6397Z"/>' +
    /* D */ '<path class="np__l" d="M96.7899 7.25C99.7001 7.25 101.959 8.03333 103.566 9.6C105.174 11.15 105.977 13.2833 105.977 16C105.977 18.7167 105.165 20.8583 103.541 22.425C101.934 23.975 99.6832 24.75 96.7899 24.75H87.9071V7.25H96.7899ZM91.0034 10.05V21.925H96.7138C98.8795 21.925 100.436 21.4667 101.384 20.55C102.331 19.6167 102.805 18.1 102.805 16C102.805 13.9 102.323 12.3833 101.358 11.45C100.411 10.5167 98.8626 10.05 96.7138 10.05H91.0034Z"/>' +
    /* A */ '<path class="np__l" d="M112.826 7.25H117.09L124.653 24.75H121.456L119.603 20.475H110.314L108.436 24.75H105.213L112.826 7.25ZM111.354 17.775H118.537L116.05 12.275L115.009 9.6H114.882L113.842 12.275L111.354 17.775Z"/>' +
    /* L */ '<path class="np__l" d="M128.991 21.925H138.635V24.75H125.87V7.25H128.991V21.925Z"/>' +
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

  function buildIntro() {
    var frames = [],
      f,
      i;
    if (reduced) {
      for (f = 0; f < INTRO_FRAMES; f++) {
        frames.push({
          logo: Math.min(1, f / (INTRO_FRAMES - 2)),
          icon: 1,
          letters: [1, 1, 1, 1, 1, 1],
          arc: "progress",
        });
      }
      return frames;
    }
    // letters pop in shuffled, each with its own little flicker (o, d, n, d, l, a — as in the video)
    var order = [1, 3, 0, 2, 5, 4],
      starts = [1, 2, 4, 6, 8, 10];
    var patterns = [
      [0.3, 1, 0, 1],
      [0.35, 0, 1, 0.5, 1],
      [1, 0, 0.3, 1],
      [0.3, 0.6, 0, 1, 1],
      [0.4, 1, 1, 0, 1],
    ];
    var letterOp = [[], [], [], [], [], []];
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
          s.letters = [0, 0, 0, 0, 0, 0];
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
          s.letters = [0, 0, 0, 0, 0, 0];
        } else {
          s.icon = 1;
          s.letters = [1, 1, 1, 1, 1, 1];
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
    letters: [1, 1, 1, 1, 1, 1],
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

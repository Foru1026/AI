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
    /* B */ '<path class="np__l" d="M38.003 22.972L38.003 9.028L44.242 9.028Q46.481 9.028 47.613 10.04Q48.728 11.036 48.728 12.653Q48.728 14.701 46.545 15.442L46.545 15.506Q47.708 15.857 48.425 16.773Q49.134 17.689 49.134 18.956Q49.134 20.805 47.907 21.857Q46.64 22.972 44.393 22.972ZM40.832 16.733L40.832 20.629L44.083 20.629Q45.103 20.629 45.684 20.112Q46.266 19.602 46.266 18.741Q46.266 17.785 45.636 17.259Q44.999 16.733 44.003 16.733ZM40.832 14.645L43.891 14.645Q44.824 14.645 45.389 14.207Q45.955 13.769 45.955 12.964Q45.955 12.191 45.421 11.761Q44.887 11.331 43.947 11.331L40.832 11.331Z"/>' +
    /* E */ '<path class="np__l" d="M50.314 22.972L50.314 9.028L60.577 9.028L60.577 11.41L53.142 11.41L53.142 14.526L59.66 14.526L59.66 16.845L53.142 16.845L53.142 20.614L60.632 20.614L60.632 22.972Z"/>' +
    /* N */ '<path class="np__l" d="M61.907 22.972L61.907 9.028L64.776 9.028L69.421 16.813Q69.612 17.139 69.859 17.625Q70.098 18.12 70.234 18.446L70.393 18.757L70.433 18.757Q70.353 17.315 70.353 16.343L70.353 9.028L73.142 9.028L73.142 22.972L70.409 22.972L65.652 15.267Q65.461 14.94 65.206 14.462Q64.951 13.984 64.816 13.649L64.656 13.339L64.616 13.339Q64.696 14.797 64.696 15.777L64.696 22.972Z"/>' +
    /* C */ '<path class="np__l" d="M83.716 23.267Q80.768 23.267 78.887 21.227Q77.007 19.187 77.007 16.048Q77.007 12.892 78.839 10.821Q80.672 8.757 83.692 8.757Q86.186 8.757 87.7 10.072Q89.214 11.386 89.445 13.458L86.64 13.458Q86.441 12.382 85.676 11.761Q84.903 11.132 83.692 11.132Q81.843 11.132 80.863 12.502Q79.891 13.865 79.891 16.048Q79.891 18.215 80.935 19.578Q81.979 20.94 83.716 20.94Q84.943 20.94 85.764 20.271Q86.576 19.602 86.712 18.486L89.485 18.486Q89.365 20.454 87.947 21.785Q86.361 23.267 83.716 23.267Z"/>' +
    /* L */ '<path class="np__l" d="M90.473 22.972L90.473 9.028L93.294 9.028L93.294 20.614L99.851 20.614L99.851 22.972Z"/>' +
    /* A */ '<path class="np__l" d="M99.979 22.972L104.831 9.028L107.756 9.028L112.672 22.972L109.732 22.972L108.791 20.008L103.764 20.008L102.847 22.972ZM105.668 13.825L104.425 17.841L108.106 17.841L106.863 13.825L106.297 11.681L106.258 11.681Q105.907 13.084 105.668 13.825Z"/>' +
    /* R */ '<path class="np__l" d="M113.365 22.972L113.365 9.028L119.764 9.028Q121.771 9.028 123.007 10.104Q124.25 11.171 124.25 12.908Q124.25 15.578 121.692 16.279L121.692 16.343Q122.688 16.637 123.182 17.267Q123.684 17.904 123.819 19.147Q123.859 19.618 123.907 20.255Q123.955 20.884 123.987 21.259Q124.011 21.625 124.058 22Q124.114 22.366 124.202 22.574Q124.289 22.781 124.425 22.837L124.425 22.972L121.708 22.972Q121.636 22.932 121.572 22.829Q121.517 22.717 121.477 22.526Q121.437 22.327 121.413 22.127Q121.381 21.92 121.349 21.594Q121.325 21.275 121.301 21.028Q121.285 20.789 121.254 20.39Q121.222 19.992 121.206 19.753Q121.03 17.378 118.473 17.378L116.194 17.378L116.194 22.972ZM116.194 11.307L116.194 15.187L119.198 15.187Q120.305 15.187 120.903 14.661Q121.501 14.135 121.501 13.283Q121.501 12.398 120.935 11.857Q120.369 11.307 119.277 11.307Z"/>' +
    /* K */ '<path class="np__l" d="M125.58 22.972L125.58 9.028L128.409 9.028L128.409 14.59L133.771 9.028L137.285 9.028L131.827 14.606L137.636 22.972L134.321 22.972L129.835 16.462L128.409 17.904L128.409 22.972Z"/>' +
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

  var LETTER_COUNT = 8;
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
    var order = [1, 4, 0, 6, 2, 7, 3, 5],
      starts = [1, 2, 3, 5, 6, 8, 9, 11];
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

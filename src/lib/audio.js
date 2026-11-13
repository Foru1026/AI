export function createMusicController(audio, onState) {
  let disposed = false;
  let started = false;
  let wanted = false;
  let pending = false;
  let confirmed = false;
  let error = false;
  let generation = 0;

  const emit = () => {
    if (disposed) return;
    onState({
      playing: confirmed && !audio.paused && !audio.muted && audio.volume > 0,
      pending,
      error,
    });
  };
  const stop = () => {
    generation++;
    wanted = false;
    pending = false;
    confirmed = false;
    audio.pause();
    emit();
  };
  const play = () => {
    const id = ++generation;
    wanted = true;
    pending = true;
    error = false;
    emit();
    const fail = (err) => {
      if (disposed || id !== generation) return;
      wanted = false;
      pending = false;
      confirmed = false;
      error = err?.name !== "NotAllowedError" && err?.name !== "AbortError";
      emit();
    };
    try {
      return Promise.resolve(audio.play()).then(() => {
        if (disposed || id !== generation) return;
        pending = false;
        confirmed = wanted && !audio.paused;
        emit();
      }, fail);
    } catch (err) {
      fail(err);
      return Promise.resolve();
    }
  };
  const onPlaying = () => {
    if (!wanted) {
      audio.pause();
      return;
    }
    pending = false;
    confirmed = true;
    error = false;
    emit();
  };
  const onPause = () => {
    generation++;
    wanted = false;
    pending = false;
    confirmed = false;
    emit();
  };
  const listeners = {
    playing: onPlaying,
    pause: onPause,
    ended: onPause,
    error: () => {
      generation++;
      wanted = false;
      pending = false;
      confirmed = false;
      error = true;
      emit();
    },
    volumechange: emit,
  };
  for (const [name, fn] of Object.entries(listeners)) audio.addEventListener(name, fn);
  emit();

  return {
    start() {
      if (started || disposed) return;
      started = true;
      return play();
    },
    toggle() {
      if (disposed) return;
      return wanted ? stop() : play();
    },
    dispose() {
      disposed = true;
      generation++;
      for (const [name, fn] of Object.entries(listeners)) audio.removeEventListener(name, fn);
      audio.pause();
    },
  };
}

export function createGlitchSound(audio, options = {}) {
  let enabled = false;
  let disposed = false;
  let prepared = false;
  let generation = 0;
  let playingId = 0;
  let context = null;
  let gain = null;
  let buffer = null;
  let source = null;
  let loading = null;
  const onState = options.onState ?? (() => {});
  const createContext =
    options.createContext ??
    (() => {
      const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
      return Ctor ? new Ctor() : null;
    });
  const loadAudio =
    options.loadAudio ??
    (async () => {
      const res = await fetch(audio.getAttribute("src"));
      if (!res.ok) throw new Error("Glitch audio unavailable");
      return res.arrayBuffer();
    });
  audio.volume = 0.45;

  const stop = () => {
    generation++;
    playingId = 0;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {}
      source.disconnect();
      source = null;
    }
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {}
    onState("idle");
  };
  const prepare = () => {
    if (disposed || prepared) return loading;
    prepared = true;
    try {
      context = createContext();
    } catch {
      context = null;
    }
    if (context) {
      gain = context.createGain();
      gain.gain.value = 0.45;
      gain.connect(context.destination);
      loading = Promise.resolve()
        .then(loadAudio)
        .then((data) => (disposed ? null : context.decodeAudioData(data)))
        .then((decoded) => {
          if (!disposed) buffer = decoded;
        })
        .catch(() => {});
    } else {
      audio.preload = "auto";
      audio.load();
      loading = Promise.resolve();
    }
    return loading;
  };
  const resume = () => {
    if (context && context.state !== "running") {
      try {
        return Promise.resolve(context.resume()).catch(() => {});
      } catch {}
    }
    return Promise.resolve();
  };
  const onPlaying = () => {
    if (disposed || !enabled || !playingId || playingId !== generation) audio.pause();
    else onState("playing");
  };
  const onEnded = () => {
    playingId = 0;
    onState("idle");
  };
  audio.addEventListener("playing", onPlaying);
  audio.addEventListener("ended", onEnded);

  return {
    setEnabled(value) {
      if (disposed) return;
      enabled = !!value;
      if (enabled) {
        prepare();
        resume();
      } else stop();
    },
    prepareGesture() {
      if (disposed) return;
      prepare();
      resume();
    },
    play() {
      if (disposed || !enabled) return Promise.resolve(false);
      stop();
      const id = ++generation;
      playingId = id;
      if (context) {
        return Promise.resolve(loading)
          .then(() => {
            if (disposed || !enabled || id !== generation || !buffer || context.state !== "running") return false;
            const node = context.createBufferSource();
            node.buffer = buffer;
            node.connect(gain);
            node.onended = () => {
              node.disconnect();
              if (source === node) {
                source = null;
                playingId = 0;
                onState("idle");
              }
            };
            source = node;
            node.start();
            onState("playing");
            return true;
          })
          .catch(() => {
            if (id === generation) stop();
            return false;
          });
      }
      try {
        audio.currentTime = 0;
        return Promise.resolve(audio.play()).then(
          () => {
            onPlaying();
            return id === generation && !audio.paused;
          },
          () => {
            if (id === generation) playingId = 0;
            return false;
          },
        );
      } catch {
        playingId = 0;
        return Promise.resolve(false);
      }
    },
    stop,
    dispose() {
      disposed = true;
      enabled = false;
      stop();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      gain?.disconnect();
      if (context) {
        try {
          Promise.resolve(context.close()).catch(() => {});
        } catch {}
      }
    },
  };
}

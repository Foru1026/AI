import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createGlitchSound, createMusicController } from "../lib/audio.js";
import { ASSETS } from "../config/assets.ts";

export default function MusicToggle({ ready, ref }) {
  const music = useRef(null);
  const musicController = useRef(null);
  const glitch = useRef(null);
  const glitchController = useRef(null);
  const [state, setState] = useState({ playing: false, pending: false, error: false });

  useEffect(() => {
    const sound = createGlitchSound(glitch.current, {
      onState: (value) => {
        if (glitch.current) glitch.current.dataset.playback = value;
      },
    });
    glitchController.current = sound;
    const controller = createMusicController(music.current, (next) => {
      sound.setEnabled(next.playing);
      setState(next);
    });
    musicController.current = controller;
    return () => {
      musicController.current = null;
      glitchController.current = null;
      controller.dispose();
      sound.dispose();
    };
  }, []);

  useEffect(() => {
    if (ready) musicController.current?.start();
  }, [ready]);

  useImperativeHandle(
    ref,
    () => ({
      playGlitch: () => glitchController.current?.play(),
      stopGlitch: () => glitchController.current?.stop(),
    }),
    [],
  );

  return (
    <>
      <audio ref={music} src={ASSETS.music.track} preload="none" loop aria-hidden="true" />
      <audio ref={glitch} src={ASSETS.music.glitch} preload="none" aria-hidden="true" />
      <button
        className="music-toggle"
        type="button"
        disabled={!ready}
        aria-pressed={state.playing}
        aria-busy={state.pending}
        aria-label={state.playing || state.pending ? "Turn music off" : "Turn music on"}
        title={state.error ? "Music could not play. Click to retry." : undefined}
        onPointerDown={(e) => {
          if (e.isPrimary && e.button === 0) e.preventDefault();
        }}
        onClick={(e) => {
          if (e.detail > 0) e.currentTarget.blur();
          if (!state.playing && !state.pending) glitchController.current?.prepareGesture();
          musicController.current?.toggle();
        }}
      >
        <span className="music-toggle__icon" aria-hidden="true">
          <img className="music-toggle__frame" src={ASSETS.music.switchFrame} alt="" draggable="false" />
          <img
            className="music-toggle__speaker music-toggle__speaker--on"
            src={ASSETS.music.speakerOn}
            alt=""
            draggable="false"
          />
          <img
            className="music-toggle__speaker music-toggle__speaker--off"
            src={ASSETS.music.speakerOff}
            alt=""
            draggable="false"
          />
        </span>
        <span className="music-toggle__label" aria-hidden="true">
          <span>Music</span>
          <span>{state.playing ? "[OFF]" : "[ON]"}</span>
        </span>
      </button>
    </>
  );
}

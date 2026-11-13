// Host integration only. The supplied scenes keep their own renderers and timelines.
(() => {
  if (window.parent === window || !new URLSearchParams(location.search).has('embedded')) return;

  const nativeNow = performance.now.bind(performance);
  const nativeRAF = requestAnimationFrame.bind(window);
  const nativeCancel = cancelAnimationFrame.bind(window);
  const callbacks = new Map();
  let active = false, pausedAt = nativeNow(), pausedTotal = 0, frameId = 0, nextId = 0;
  // Freeze the scene's clock too: returning to a paused scene must not jump its animation.
  const clock = () => (active ? nativeNow() : pausedAt) - pausedTotal;
  Object.defineProperty(performance, 'now', { configurable: true, value: clock });
  const schedule = () => {
    if (!active || frameId || !callbacks.size) return;
    frameId = nativeRAF(() => {
      frameId = 0;
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback(clock());
      schedule();
    });
  };
  window.requestAnimationFrame = callback => {
    const id = ++nextId;
    callbacks.set(id, callback);
    schedule();
    return id;
  };
  window.cancelAnimationFrame = id => callbacks.delete(id);

  const send = (type, details = {}) => parent.postMessage({ channel: 'nodal-datacluster', type, ...details }, location.origin);
  document.documentElement.classList.add('embedded');
  window.NodalHost = { send, progress: 0, journey: 0, speed: 0, pointer: null, optics: null, tick: callback => nativeRAF(callback) };
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.channel !== 'nodal-datacluster') return;
    if (event.data.type === 'progress') {
      window.NodalHost.progress = Math.max(0, Math.min(1, Number(event.data.value) || 0));
      window.NodalHost.journey = Math.max(0, Math.min(1, Number(event.data.journey) || 0));
      window.NodalHost.speed = Math.max(0, Number(event.data.speed) || 0);
      return;
    }
    if (event.data.type === 'pointer') { window.NodalHost.pointer = event.data.value; return; }
    if (event.data.type === 'cursor-enabled') { document.documentElement.classList.toggle('has-custom-cursor', event.data.value === true); return; }
    if (event.data.type === 'optics') { window.NodalHost.optics = event.data.value; return; }
    if (event.data.type !== 'active' || active === event.data.value) return;
    if (event.data.value) {
      pausedTotal += nativeNow() - pausedAt;
      active = true;
      schedule();
    } else {
      pausedAt = nativeNow();
      active = false;
      nativeCancel(frameId);
      frameId = 0;
    }
  });
  addEventListener('load', () => send('ready'));
  addEventListener('error', event => send('error', { message: event.message }));
  addEventListener('unhandledrejection', event => send('error', { message: String(event.reason?.message || event.reason) }));

  // Pointer events do not bubble out of an iframe. Relay only input/hover,
  // never duplicate the cursor or run another animation loop in this scene.
  const cursorPointer = event => send('cursor-pointer', {
    x: event.clientX/innerWidth, y: event.clientY/innerHeight, pointerType: event.pointerType,
    interactive: !!event.target?.closest?.('a[href], button:not(:disabled), [role="button"], input, select, textarea'),
    tone: event.target?.closest?.('[data-cursor-tone]')?.getAttribute('data-cursor-tone') === 'dark' ? 'dark' : 'light',
  });
  addEventListener('pointermove', cursorPointer, { passive: true });
  addEventListener('pointerover', cursorPointer, { passive: true });
  addEventListener('pointerdown', cursorPointer, { passive: true });
  document.addEventListener('pointerleave', event => {
    // Moving onto the host UI is not leaving the viewport.
    if (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= innerWidth || event.clientY >= innerHeight) send('cursor-leave');
  });

  // One document scroll drives both shots. The iframe never has a second scroll range.
  // Pages canonicalizes HTML URLs to /glass; other hosts keep /glass.html.
  if (/\/glass(?:\.html)?$/.test(location.pathname)) {
    let lastTouch = null;
    addEventListener('wheel', event => {
      if (event.ctrlKey) return;
      event.preventDefault();
      send('scroll', { source: 'wheel', delta: event.deltaY * (event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? innerHeight : 1) });
    }, { passive: false });
    addEventListener('keydown', event => {
      const deltas = { ArrowDown: 100, ArrowUp: -100, PageDown: innerHeight * .85, PageUp: -innerHeight * .85, ' ': innerHeight * .85, Home: -1e6, End: 1e6 };
      if (!(event.key in deltas)) return;
      event.preventDefault();
      send('scroll', { source: 'keyboard', delta: event.key === ' ' && event.shiftKey ? -deltas[' '] : deltas[event.key] });
    });
    addEventListener('touchstart', event => { lastTouch = event.touches[0].clientY; send('touch-state', { value: true }); }, { passive: true });
    addEventListener('touchmove', event => {
      const y = event.touches[0].clientY;
      if (lastTouch !== null) { event.preventDefault(); send('scroll', { source: 'touch', delta: lastTouch - y }); }
      lastTouch = y;
    }, { passive: false });
    const endTouch = () => { lastTouch = null; send('touch-state', { value: false }); };
    addEventListener('touchend', endTouch, { passive: true });
    addEventListener('touchcancel', endTouch, { passive: true });
  }
})();

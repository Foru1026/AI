const instance = window.NoddalPreloader;
if (!instance) throw new Error("NODDAL preloader failed to initialize");
export const preloader: NoddalPreloader = instance;
// Do not hook THREE.DefaultLoadingManager — HDR / rock / iframe assets would
// keep the preloader stuck until every background download finished.

export const loadTasks = {
  hero: preloader.task("Hero shaders and first frames", 3),
  tunnel: preloader.task("Tunnel first frame", 1.5),
  // Released when the first screen can open; datacluster may still be loading.
  continuation: preloader.task("Glass, images, eye and energy portal", 0.25),
  ui: preloader.task("Interface fonts", 0.5),
} satisfies Record<string, PreloaderTask>;

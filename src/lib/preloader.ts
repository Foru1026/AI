import * as THREE from "three";

const instance = window.NoddalPreloader;
if (!instance) throw new Error("NODDAL preloader failed to initialize");
export const preloader: NoddalPreloader = instance;
preloader.three(THREE.DefaultLoadingManager);

export const loadTasks = {
  hero: preloader.task("Hero shaders and first frames", 2),
  tunnel: preloader.task("Tunnel first frame", 1),
  continuation: preloader.task("Glass, images, eye and energy portal", 4),
  ui: preloader.task("Interface fonts", 0.5),
} satisfies Record<string, PreloaderTask>;

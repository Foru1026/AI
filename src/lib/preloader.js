import * as THREE from "three";

export const preloader = window.NoddalPreloader;
if (!preloader) throw new Error("NODDAL preloader failed to initialize");
preloader.three(THREE.DefaultLoadingManager);

export const loadTasks = {
  hero: preloader.task("Hero shaders and first frames", 2),
  tunnel: preloader.task("Tunnel first frame", 1),
  continuation: preloader.task("Glass, images, eye and energy portal", 4),
  ui: preloader.task("Interface fonts", 0.5),
};

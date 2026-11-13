import { useSyncExternalStore } from "react";
import { MEDIA, currentProfile, layoutFor, type DeviceProfile, type Layout } from "@/config/breakpoints.ts";

const subscribe = (onChange: () => void) => {
  const coarse = matchMedia(MEDIA.coarsePointer);
  addEventListener("resize", onChange);
  coarse.addEventListener("change", onChange);
  return () => {
    removeEventListener("resize", onChange);
    coarse.removeEventListener("change", onChange);
  };
};

/** CSS layout (768 / 1024 breakpoints); matches the media queries in the stylesheets. */
export const useLayout = (): Layout => useSyncExternalStore(subscribe, () => layoutFor(innerWidth));

/** WebGL device profile (760 / 1024, coarse pointer → tablet); drives scene quality and timelines. */
export const useDeviceProfile = (): DeviceProfile => useSyncExternalStore(subscribe, currentProfile);

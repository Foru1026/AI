import { useCallback, useSyncExternalStore } from "react";
import type { MediaQuery } from "@/config/breakpoints.ts";

export function useMediaQuery(query: MediaQuery | string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches);
}

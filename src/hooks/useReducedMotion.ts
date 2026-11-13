import { MEDIA } from "@/config/breakpoints.ts";
import { useMediaQuery } from "./useMediaQuery.ts";

export const useReducedMotion = (): boolean => useMediaQuery(MEDIA.reducedMotion);

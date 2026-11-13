import type { LoadingManager } from "three";

/** API of public/assets/preloader/preloader.js (loaded as a classic script before the app). */
declare global {
  type PreloaderPhase = "idle" | "intro" | "steady" | "exit" | "reveal" | "done";

  interface PreloaderTask {
    progress(fraction: number): PreloaderTask;
    done(): PreloaderTask;
    fail(error?: unknown): PreloaderTask;
  }

  interface NoddalPreloader {
    task(label: string, weight?: number): PreloaderTask;
    track<T>(promise: Promise<T>, options?: { label?: string; weight?: number }): Promise<T>;
    three(manager?: LoadingManager): void;
    hold(label?: string, weight?: number): () => void;
    ready(): void;
    setStatus(text: string): void;
    readonly progress: number;
    readonly phase: PreloaderPhase;
    /** Labels of unfinished tasks. */
    readonly pending: string[];
    readonly revealed: Promise<void>;
    readonly completed: Promise<void>;
  }

  interface Window {
    NoddalPreloader?: NoddalPreloader;
    NODDAL_PRELOADER?: { manual?: boolean; maxWait?: number };
  }

  interface WindowEventMap {
    "noddal:progress": CustomEvent<{ progress: number; percent: number }>;
    "noddal:exit": CustomEvent<undefined>;
    "noddal:reveal": CustomEvent<undefined>;
    "noddal:complete": CustomEvent<undefined>;
  }
}

export {};

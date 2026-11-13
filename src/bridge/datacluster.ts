/**
 * postMessage protocol between this app and the datacluster iframe
 * (public/datacluster/bridge.js). Both sides must use the same channel and shapes.
 */
export const DATACLUSTER_CHANNEL = "nodal-datacluster";

export interface Lens {
  base: number;
  moving: number;
  centre: number[];
  channels: number[];
  distortion: number;
  softness: number;
  falloff: number;
}

export type ScrollSource = "wheel" | "keyboard" | "touch";
export type CursorTone = "light" | "dark";

/** Host → iframe. */
export type HostMessage =
  | { type: "pointer"; value: { x: number; y: number; active: boolean } }
  | { type: "active"; value: boolean }
  | { type: "progress"; value: number; journey: number; speed: number }
  | { type: "optics"; value: Lens }
  | { type: "cursor-enabled"; value: boolean };

/** Iframe → host. */
export type FrameMessage =
  | { type: "ready" }
  | { type: "scene-ready" }
  | { type: "loading-progress"; value: number }
  | { type: "pupil-covered"; value: boolean }
  | { type: "touch-state"; value: boolean }
  | { type: "portal-state"; phase: string; uiOpacity: number }
  | { type: "scroll"; delta: number; source: ScrollSource }
  | { type: "cursor-pointer"; x: number; y: number; interactive: boolean; pointerType: string; tone: CursorTone }
  | { type: "cursor-leave" }
  | { type: "error"; message: string };

export type FrameMessageType = FrameMessage["type"];

type FrameRef = { current: HTMLIFrameElement | null | undefined } | HTMLIFrameElement | null | undefined;

const windowOf = (frame: FrameRef): Window | null | undefined =>
  (frame && "current" in frame ? frame.current : frame)?.contentWindow;

export function postToFrame(frame: FrameRef, message: HostMessage): void {
  windowOf(frame)?.postMessage({ channel: DATACLUSTER_CHANNEL, ...message }, location.origin);
}

/**
 * Returns the payload when `event` came from this frame on the datacluster channel.
 * Payload fields are only shape-typed: the iframe is same-origin but still untrusted input,
 * so numeric fields must be checked with Number.isFinite before use.
 */
export function readFrameMessage(event: MessageEvent, frame: FrameRef): FrameMessage | null {
  if (event.origin !== location.origin || event.source !== windowOf(frame)) return null;
  const data = event.data as { channel?: unknown; type?: unknown } | null;
  if (data?.channel !== DATACLUSTER_CHANNEL || typeof data.type !== "string") return null;
  return data as FrameMessage;
}

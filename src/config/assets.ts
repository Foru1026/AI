import type { Layout } from "./breakpoints.ts";

/**
 * Every URL the React app loads. Files live in public/assets; the datacluster iframe
 * (public/datacluster) references its own assets relatively, so moving img/, portal/,
 * interface/svg/logo.svg or cursor/native.css also requires editing that app.
 */
const ROOT = "/assets";

/** An image drawn at a fixed design width per layout (width = the Figma frame size). */
export interface AssetVariant {
  src: string;
  width: number;
}
export type ResponsiveAsset = Record<Layout, AssetVariant>;

const footer = (file: string, width: number): AssetVariant => ({ src: `${ROOT}/footer/${file}`, width });
const sameForAll = (variant: AssetVariant): ResponsiveAsset => ({ mobile: variant, tablet: variant, desktop: variant });

export const ASSETS = Object.freeze({
  models: {
    serverModule: `${ROOT}/models/server-module.glb`,
    centralCube: `${ROOT}/models/central-cube.glb`,
    rock: `${ROOT}/models/rock.glb`,
  },
  environment: {
    studio: `${ROOT}/environment/studio-softboxes.hdr`,
  },
  img: {
    sky: `${ROOT}/img/Regular-BG-2_compressed.jpg`,
    tunnelFallback: `${ROOT}/img/glass-tunnel-fallback.png`,
  },
  interface: {
    logo: `${ROOT}/interface/svg/logo.svg`,
    connectorMobile: `${ROOT}/interface/svg/connector-mobile.svg`,
    connectorDesktop: `${ROOT}/interface/svg/connector-desktop.svg`,
  },
  cursor: {
    frame: `${ROOT}/cursor/frame.svg`,
  },
  footer: {
    brand: sameForAll(footer("brand-mark.svg", 26.0047)),
    ruleLeft: {
      mobile: footer("rule-left-mobile.svg", 331),
      tablet: footer("rule-left-tablet.svg", 331),
      desktop: footer("rule-left.svg", 331),
    },
    ruleRight: {
      mobile: footer("rule-right-mobile.svg", 334),
      tablet: footer("rule-right-tablet.svg", 340),
      desktop: footer("rule-right-desktop.svg", 310),
    },
    submitArrow: {
      mobile: footer("submit-arrow-mobile.svg", 11.1925),
      tablet: footer("submit-arrow-tablet.svg", 11.1925),
      desktop: footer("submit-arrow-desktop.svg", 11.1925),
    },
    wordmark: {
      mobile: footer("wordmark-mobile.svg", 390),
      tablet: footer("wordmark-tablet.svg", 768),
      desktop: footer("wordmark-desktop.svg", 1440),
    },
  } satisfies Record<string, ResponsiveAsset>,
  datacluster: "/datacluster/glass.html?embedded=1",
});

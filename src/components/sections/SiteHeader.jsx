import { ASSETS } from "../../config/assets.ts";

export default function SiteHeader({ footer, onLink }) {
  return (
    <header className={"site-header" + (footer ? " is-footer" : "")}>
      <a
        hidden={footer}
        className="site-header__logo"
        href="#hero"
        aria-label="Ben Clark — back to top"
        onClick={(e) => onLink(e, "hero")}
      >
        <img src={ASSETS.interface.logo} alt="Ben Clark" width="138" height="32" />
      </a>
    </header>
  );
}

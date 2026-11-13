import { useImperativeHandle, useLayoutEffect, useRef } from "react";
import { useContactForm, FIELD_LIMITS } from "../lib/contact.js";
import {
  footerState,
  footerDelay,
  footerMemory,
  FOOTER_REVEAL_DURATION,
  FOOTER_REVEAL_EASING,
} from "../lib/timeline.js";

const ASSET_DIR = "/assets/footer/";
const SOCIAL_LINKS = [
  ["LinkedIn", "https://www.linkedin.com/in/ivan-shmalenko-sean/"],
  ["Instagram", "https://www.instagram.com/ubernatural.io/"],
  ["X[Twitter]", "https://x.com/ubernatural"],
];

const BRAND = { desktop: ["brand-mark.svg", 26.0047] };
const RULE_LEFT = {
  desktop: ["rule-left.svg", 331],
  tablet: ["rule-left-tablet.svg", 331],
  mobile: ["rule-left-mobile.svg", 331],
};
const RULE_RIGHT = {
  desktop: ["rule-right-desktop.svg", 310],
  tablet: ["rule-right-tablet.svg", 340],
  mobile: ["rule-right-mobile.svg", 334],
};
const ARROW = {
  desktop: ["submit-arrow-desktop.svg", 11.1925],
  tablet: ["submit-arrow-tablet.svg", 11.1925],
  mobile: ["submit-arrow-mobile.svg", 11.1925],
};
const WORDMARK = {
  desktop: ["wordmark-desktop.svg", 1440],
  tablet: ["wordmark-tablet.svg", 768],
  mobile: ["wordmark-mobile.svg", 390],
};

function FooterAsset({ desktop, tablet = desktop, mobile = tablet, className = "", alt = "", fluid = false, reveal }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const img = el.querySelector("img");
    const update = () => {
      const asset = innerWidth < 768 ? mobile : innerWidth < 1024 ? tablet : desktop;
      el.style.setProperty("--footer-asset-scale", String(fluid ? el.clientWidth / asset[1] : 1));
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    img.addEventListener("load", update);
    update();
    return () => {
      observer.disconnect();
      img.removeEventListener("load", update);
    };
  }, [desktop, tablet, mobile, fluid]);

  return (
    <picture ref={ref} className={"contact-footer__asset " + className} data-footer-reveal={reveal}>
      <source media="(max-width: 767.98px)" srcSet={ASSET_DIR + mobile[0]} />
      <source media="(max-width: 1023.98px)" srcSet={ASSET_DIR + tablet[0]} />
      <img src={ASSET_DIR + desktop[0]} alt={alt} draggable="false" />
    </picture>
  );
}

function Field({ name, label, type, autoComplete, required, right, disabled }) {
  return (
    <label className="contact-footer__field" data-footer-reveal={"field-" + name}>
      <span className="contact-footer__field-label">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        maxLength={FIELD_LIMITS[name]}
        disabled={disabled}
      />
      <FooterAsset {...(right ? RULE_RIGHT : RULE_LEFT)} fluid className="contact-footer__rule" />
    </label>
  );
}

function Legal({ privacyHref, termsHref, className = "" }) {
  return (
    <p className={"contact-footer__legal " + className} data-footer-reveal="legal">
      {privacyHref ? <a href={privacyHref}>Privacy Policy</a> : <span>Privacy Policy</span>}
      {"  | "}
      {termsHref ? <a href={termsHref}>Terms &amp; Conditions</a> : <span>Terms &amp; Conditions</span>}
    </p>
  );
}

export default function ContactFooter({ ref, active = false, preview = false, onSubmit, privacyHref, termsHref }) {
  const viewport = useRef(null);
  const content = useRef(null);
  const size = useRef({ width: 0, height: 0, contentHeight: 0 });
  const journey = useRef(0);
  const last = useRef({});
  const memory = useRef(null);
  const form = useContactForm(onSubmit);

  const apply = () => {
    const el = viewport.current;
    if (!el) return;
    const { width, height, contentHeight } = size.current;
    const next = preview
      ? { mask: "none", interactive: true, offset: 0 }
      : footerState(journey.current, width, height, contentHeight);
    if (last.current.mask !== next.mask) el.style.setProperty("--footer-mask", next.mask);
    if (last.current.interactive !== next.interactive) {
      el.dataset.interactive = String(next.interactive);
      el.inert = !next.interactive;
      memory.current ??= footerMemory(preview ? null : undefined);
      const reveal = memory.current.update(next.interactive);
      el.dataset.revealed = String(reveal.revealed);
      el.dataset.revealInstant = String(reveal.instant);
    }
    if (last.current.offset !== next.offset) content.current.style.transform = `translateY(${-next.offset}px)`;
    last.current = next;
  };

  useImperativeHandle(ref, () => ({
    update(value) {
      journey.current = value;
      apply();
    },
  }));

  useLayoutEffect(() => {
    const measure = () => {
      size.current = {
        width: viewport.current.clientWidth,
        height: viewport.current.clientHeight,
        contentHeight: content.current.getBoundingClientRect().height,
      };
      viewport.current.style.setProperty("--footer-reveal-duration", FOOTER_REVEAL_DURATION + "ms");
      viewport.current.style.setProperty("--footer-reveal-easing", FOOTER_REVEAL_EASING);
      for (const node of viewport.current.querySelectorAll("[data-footer-reveal]")) {
        node.style.setProperty("--footer-reveal-delay", footerDelay(node.dataset.footerReveal, size.current.width) + "ms");
      }
      apply();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current);
    observer.observe(content.current);
    measure();
    return () => observer.disconnect();
  }, [preview]);

  const onTransitionEnd = (event) => {
    if (
      event.propertyName === "opacity" &&
      event.currentTarget.dataset.revealed === "true" &&
      event.target.hasAttribute("data-footer-reveal")
    ) {
      event.target.dataset.footerEntered = "true";
    }
  };

  return (
    <div
      ref={viewport}
      className={"contact-footer-viewport" + (active || preview ? " is-active" : "") + (preview ? " is-preview" : "")}
      data-scene="follow"
      data-interactive={preview ? "true" : undefined}
      aria-hidden={!active && !preview}
      inert={!preview}
      onTransitionEnd={onTransitionEnd}
    >
      <FooterAsset {...BRAND} className="contact-footer__brand" alt="übernatural" reveal="brand" />
      <div className="contact-footer__scroll">
        <footer ref={content} className="contact-footer" aria-label="Contacts">
          <div className="contact-footer__top">
            <span className="contact-footer__brand-space" aria-hidden="true" />
            <div className="contact-footer__details">
              <nav className="contact-footer__social" aria-label="Social Media">
                <h3 className="contact-footer__caption" data-footer-reveal="social-title">
                  Social Media
                </h3>
                <ul className="contact-footer__social-links">
                  {SOCIAL_LINKS.map(([label, href], i) => (
                    <li key={href} data-footer-reveal={"social-" + i}>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="contact-footer__contacts">
                <h3 className="contact-footer__caption" data-footer-reveal="contacts-title">
                  Contacts
                </h3>
                <address className="contact-footer__address">
                  <div className="contact-footer__location">
                    <p>
                      <span className="contact-footer__address-line" data-footer-reveal="address-0">
                        Advanced Design
                      </span>
                      <span className="contact-footer__address-line" data-footer-reveal="address-1">
                        Technologies Ltd., DIFC, UAE
                      </span>
                    </p>
                    <p>
                      <span className="contact-footer__address-line" data-footer-reveal="address-2">
                        Innovation One, Level
                      </span>
                      <span className="contact-footer__address-line" data-footer-reveal="address-3">
                        3, DIFC, Dubai
                      </span>
                    </p>
                  </div>
                  <a className="contact-footer__email" href="mailto:bogdan@ubernatural.io" data-footer-reveal="contact-email">
                    bogdan@ubernatural.io
                  </a>
                </address>
              </div>
            </div>
          </div>

          <div className="contact-footer__middle">
            <div className="contact-footer__proposal">
              <div className="contact-footer__intro">
                <h2 className="contact-footer__title" data-footer-reveal="proposal-title">
                  How to reach you?
                </h2>
                <p className="contact-footer__description" data-footer-reveal="proposal-description">
                  We’ll use this to send over the proposal.
                </p>
              </div>
              <form
                className="contact-footer__form"
                onSubmit={form.submit}
                onInput={form.clearStatus}
                aria-label="Request a proposal"
                aria-busy={form.pending}
              >
                <input
                  className="contact-footer__honeypot"
                  name="website"
                  type="text"
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className="contact-footer__form-column contact-footer__form-column--left">
                  <Field name="name" label="Your Name" type="text" autoComplete="name" required disabled={form.pending} />
                  <Field name="email" label="Email" type="email" autoComplete="email" required disabled={form.pending} />
                </div>
                <div className="contact-footer__form-column contact-footer__form-column--right">
                  <Field name="phone" label="Phone Number" type="tel" autoComplete="tel" right disabled={form.pending} />
                  <button
                    className="contact-footer__submit"
                    type="submit"
                    disabled={form.pending}
                    data-footer-reveal="submit"
                    data-cursor-tone="dark"
                  >
                    <span className="contact-footer__submit-label">{form.pending ? "Sending…" : "Submit"}</span>
                    <span className="contact-footer__submit-icon" aria-hidden="true">
                      <FooterAsset {...ARROW} className="contact-footer__arrow" />
                    </span>
                  </button>
                </div>
                <p className="contact-footer__form-status" role="status">
                  {form.status}
                </p>
              </form>
            </div>
          </div>

          <div className="contact-footer__bottom">
            <div className="contact-footer__credits">
              <p data-footer-reveal="credit">Made by übernatural. 2026.</p>
              <Legal privacyHref={privacyHref} termsHref={termsHref} />
            </div>
            <FooterAsset {...WORDMARK} className="contact-footer__wordmark" fluid />
          </div>
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useContactForm, FIELD_LIMITS } from "../../lib/contact.js";
import {
  footerState,
  footerDelay,
  footerMemory,
  FOOTER_REVEAL_DURATION,
  FOOTER_REVEAL_EASING,
} from "../../lib/timeline.js";
import { ASSETS } from "../../config/assets.ts";
import { MEDIA, layoutFor } from "../../config/breakpoints.ts";

const EMAIL = "benclarkk1026@gmail.com";
const CHANNELS = [
  { id: "email", label: "Email", value: EMAIL, href: `mailto:${EMAIL}`, action: "Write" },
  { id: "whatsapp", label: "WhatsApp", value: "+1 (730) 210-3965", href: "https://wa.me/17302103965", action: "Chat" },
  { id: "telegram", label: "Telegram", value: "@foru10261", href: "https://t.me/foru10261", action: "Message" },
  { id: "discord", label: "Discord", value: "foru10261", copy: "foru10261", action: "Copy ID" },
  { id: "resume", label: "Résumé", value: "4U_Resume.pdf", href: "/4U_Resume.pdf", action: "Download", download: true },
];

function FooterAsset({ asset, className = "", alt = "", fluid = false, reveal }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const img = el.querySelector("img");
    const update = () => {
      const variant = asset[layoutFor(innerWidth)];
      el.style.setProperty("--footer-asset-scale", String(fluid ? el.clientWidth / variant.width : 1));
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    img.addEventListener("load", update);
    update();
    return () => {
      observer.disconnect();
      img.removeEventListener("load", update);
    };
  }, [asset, fluid]);

  return (
    <picture ref={ref} className={"contact-footer__asset " + className} data-footer-reveal={reveal}>
      <source media={MEDIA.mobile} srcSet={asset.mobile.src} />
      <source media={MEDIA.belowDesktop} srcSet={asset.tablet.src} />
      <img src={asset.desktop.src} alt={alt} draggable="false" />
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
      <FooterAsset asset={right ? ASSETS.footer.ruleRight : ASSETS.footer.ruleLeft} fluid className="contact-footer__rule" />
    </label>
  );
}

function Channel({ channel, index }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const body = (
    <>
      <span className="contact-footer__channel-label">{channel.label}</span>
      <span className="contact-footer__channel-value">{channel.value}</span>
      <span className="contact-footer__channel-action">
        {copied ? "Copied" : channel.action}
        <span aria-hidden="true">{channel.copy ? (copied ? " ✓" : " ⧉") : channel.download ? " ↓" : " ↗"}</span>
      </span>
    </>
  );

  return (
    <li className="contact-footer__channel" data-footer-reveal={"channel-" + index}>
      {channel.copy ? (
        <button
          type="button"
          className="contact-footer__channel-link"
          aria-label={`Copy ${channel.label} ID ${channel.value}`}
          onClick={() => navigator.clipboard?.writeText(channel.copy).then(() => setCopied(true), () => {})}
        >
          {body}
        </button>
      ) : (
        <a
          className="contact-footer__channel-link"
          href={channel.href}
          {...(channel.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...(channel.download ? { download: true } : {})}
        >
          {body}
        </a>
      )}
      <span className="contact-footer__channel-status" role="status">
        {copied ? `${channel.label} ID copied` : ""}
      </span>
    </li>
  );
}

export default function ContactFooter({ ref, active = false, preview = false, onSubmit }) {
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
      onTransitionEnd={onTransitionEnd}
    >
      <FooterAsset asset={ASSETS.footer.brand} className="contact-footer__brand" alt="4U" reveal="brand" />
      <div className="contact-footer__scroll">
        <footer ref={content} className="contact-footer" aria-label="Contact">
          <div className="contact-footer__top">
            <span className="contact-footer__brand-space" aria-hidden="true" />
            <div className="contact-footer__meta" data-footer-reveal="top-meta">
              <p className="contact-footer__availability">
                <span className="contact-footer__pulse" aria-hidden="true" />
                Open to new opportunities
              </p>
            </div>
          </div>

          <div className="contact-footer__middle">
            <div className="contact-footer__proposal">
              <div className="contact-footer__intro">
                <p className="contact-footer__eyebrow" data-footer-reveal="proposal-eyebrow">
                  Contact
                </p>
                <h2 className="contact-footer__title" data-footer-reveal="proposal-title">
                  Let’s build what’s next.
                </h2>
                <p className="contact-footer__description" data-footer-reveal="proposal-description">
                  Hiring, or shipping an AI product? Leave your details and I’ll reply personally.
                </p>
              </div>
              <form
                className="contact-footer__form"
                onSubmit={form.submit}
                onInput={form.clearStatus}
                aria-label="Contact 4U"
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
                    <span className="contact-footer__submit-label">{form.pending ? "Sending…" : "Send message"}</span>
                    <span className="contact-footer__submit-icon" aria-hidden="true">
                      <FooterAsset asset={ASSETS.footer.submitArrow} className="contact-footer__arrow" />
                    </span>
                  </button>
                </div>
                <p className="contact-footer__form-status" role="status">
                  {form.status}
                </p>
              </form>
            </div>

            <nav className="contact-footer__channels" aria-label="Direct contact">
              <h3 className="contact-footer__caption" data-footer-reveal="channels-title">
                Direct channels
              </h3>
              <ul className="contact-footer__channel-list">
                {CHANNELS.map((channel, i) => (
                  <Channel key={channel.id} channel={channel} index={i} />
                ))}
              </ul>
            </nav>
          </div>

          <div className="contact-footer__bottom">
            <div className="contact-footer__credits">
              <p data-footer-reveal="credit">© 2026 4U. All rights reserved.</p>
              <p data-footer-reveal="legal">Senior AI &amp; Full Stack Engineer · For U</p>
            </div>
            <div className="contact-footer__wordmark" aria-hidden="true">
              <svg viewBox="0 0 1440 205" preserveAspectRatio="xMidYMax meet">
                <text x="720" y="205" textAnchor="middle" textLength="720" lengthAdjust="spacing">
                  4U
                </text>
              </svg>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

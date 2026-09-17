import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Contact.css";

gsap.registerPlugin(ScrollTrigger);

const cx = (...parts) => parts.filter(Boolean).join(" ");
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const EMAIL = "workwithsafayath@gmail.com";

const arrowIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
    <path
      d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SOCIALS = [
  {
    id: "facebook",
    label: "Facebook",
    handle: "MD.safayath.rahman",
    url: "https://www.facebook.com/MD.safayath.rahman",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.4 21v-6.9h2.32l.44-2.86H13.4V9.35c0-.83.35-1.56 1.58-1.56h1.27V5.27a15 15 0 0 0-2.02-.13c-2.14 0-3.6 1.3-3.6 3.7v2.4H8.35v2.86h2.28V21h2.77Z"
        />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@vintayath",
    url: "https://www.instagram.com/vintayath/",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <rect
          x="3.2"
          y="3.2"
          width="17.6"
          height="17.6"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="17.3" cy="6.7" r="1.35" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "in/safayath-rahman",
    url: "https://www.linkedin.com/in/safayath-rahman/",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3.5a1.97 1.97 0 1 0 0 3.94 1.97 1.97 0 0 0 0-3.94ZM21 13.62c0-3.36-1.79-4.92-4.18-4.92-1.93 0-2.79 1.06-3.27 1.8V8.5H10.2V21h3.38v-6.62c0-1.66.31-3.27 2.37-3.27 2.03 0 2.05 1.9 2.05 3.38V21H21v-7.38Z"
        />
      </svg>
    ),
  },
];

/**
 * Contact — the invitation.
 *
 * Every contact row carries a second, inverted copy of itself under a
 * circular clip-path. On hover/press the circle grows from the exact
 * pointer position to cover the row; on leave it collapses back to the
 * cursor. Radius and center are plain custom properties written by ONE
 * coalesced rAF loop — never React state.
 *
 * Reduced motion swaps the circle for an opacity crossfade (the reveal
 * still happens — it is feedback, not decoration of motion).
 */
export default function Contact() {
  const sectionRef = useRef(null);
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED_QUERY).matches
  );
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  /* Per-row mutable tracking state. Index 0 is the email row, 1–3 the
     socials — matching handler order below. */
  const rows = useRef(
    Array.from({ length: 4 }, () => ({
      el: null,
      rect: null,
      w: 0,
      h: 0,
      r: 0,
      tr: 0,
      cx: 0,
      cy: 0,
      cxT: 0,
      cyT: 0,
    }))
  );
  const frame = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_QUERY);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    []
  );

  /* Scroll reveal — gated and live-re-run via gsap.matchMedia. */
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.from(".contact__line-inner", {
          yPercent: 118,
          duration: 0.95,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 74%" },
        });
        gsap.from(".contact__block", {
          opacity: 0,
          y: 40,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 68%" },
        });
      }, sectionRef);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  /* ------------------------------------------------------------------
     Circular reveal engine — one loop, one style write per frame.
     ------------------------------------------------------------------ */

  const coverRadius = (row, x, y) =>
    Math.hypot(Math.max(x, row.w - x), Math.max(y, row.h - y)) * 1.06 + 10;

  const tick = () => {
    let busy = false;
    for (const row of rows.current) {
      if (!row.el) continue;
      row.cx += (row.cxT - row.cx) * 0.5;
      row.cy += (row.cyT - row.cy) * 0.5;
      row.r += (row.tr - row.r) * 0.19;

      const settled =
        Math.abs(row.tr - row.r) < 0.7 &&
        Math.abs(row.cxT - row.cx) < 0.3 &&
        Math.abs(row.cyT - row.cy) < 0.3;
      if (settled) {
        row.r = row.tr;
        row.cx = row.cxT;
        row.cy = row.cyT;
      } else {
        busy = true;
      }

      row.el.style.setProperty("--cr", `${row.r}px`);
      row.el.style.setProperty("--cx", `${row.cx}px`);
      row.el.style.setProperty("--cy", `${row.cy}px`);
    }
    frame.current = busy ? requestAnimationFrame(tick) : null;
  };

  const start = () => {
    if (frame.current === null) frame.current = requestAnimationFrame(tick);
  };

  const wake = (row, x, y) => {
    if (row.r < 1) {
      /* Fresh reveal — anchor the circle at the pointer, no travel. */
      row.cx = x;
      row.cy = y;
    }
    row.cxT = x;
    row.cyT = y;
    row.tr = coverRadius(row, x, y);
    start();
  };

  const measure = (row) => {
    const rect = row.el.getBoundingClientRect();
    row.rect = rect;
    row.w = rect.width;
    row.h = rect.height;
    return rect;
  };

  const onEnter = (i) => (event) => {
    const row = rows.current[i];
    if (!row.el) return;
    const rect = measure(row);
    if (reduced) {
      row.el.classList.add("is-in");
      return;
    }
    wake(row, event.clientX - rect.left, event.clientY - rect.top);
  };

  const onMove = (i) => (event) => {
    const row = rows.current[i];
    if (reduced || !row.rect) return;
    row.cxT = event.clientX - row.rect.left;
    row.cyT = event.clientY - row.rect.top;
    start();
  };

  const onLeave = (i) => () => {
    const row = rows.current[i];
    if (reduced) {
      row.el?.classList.remove("is-in");
      return;
    }
    row.tr = 0; /* collapse back toward the exiting cursor */
    start();
  };

  /* Touch feedback: the circle blooms at the fingertip during the
     ~200ms before the browser navigates. */
  const onPress = (i) => (event) => {
    const row = rows.current[i];
    if (!row.el || reduced) return;
    const rect = measure(row);
    row.cx = row.cxT = event.clientX - rect.left;
    row.cy = row.cyT = event.clientY - rect.top;
    row.tr = coverRadius(row, row.cx, row.cy);
    start();
  };

  const onFocus = (i) => () => {
    const row = rows.current[i];
    if (!row.el) return;
    measure(row);
    if (reduced) {
      row.el.classList.add("is-in");
      return;
    }
    /* Keyboard reveal blooms from the row's heart. */
    row.cx = row.cxT = row.w / 2;
    row.cy = row.cyT = row.h / 2;
    row.tr = coverRadius(row, row.w / 2, row.h / 2);
    start();
  };

  const onBlur = (i) => () => {
    const row = rows.current[i];
    if (reduced) {
      row.el?.classList.remove("is-in");
      return;
    }
    row.tr = 0;
    start();
  };

  const bindRow = (i) => ({
    onMouseEnter: onEnter(i),
    onMouseMove: onMove(i),
    onMouseLeave: onLeave(i),
    onPointerDown: onPress(i),
    onFocus: onFocus(i),
    onBlur: onBlur(i),
  });

  /* ------------------------------------------------------------------ */

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const socialContent = (social) => (
    <>
      <span className="contact__icon">{social.icon}</span>
      <span className="contact__platform">{social.label}</span>
      <span className="contact__handle">{social.handle}</span>
      <span className="contact__go">{arrowIcon}</span>
    </>
  );

  return (
    <section
      ref={sectionRef}
      id="contact"
      className={cx("contact", reduced && "is-static")}
      aria-labelledby="contact-heading"
    >
      <div className="contact__inner">
        <div className="contact__lede">
          <p className="contact__kicker">Contact</p>
          <h2 className="contact__title" id="contact-heading">
            <span className="contact__line">
              <span className="contact__line-inner">Let's build something</span>
            </span>
            <span className="contact__line contact__line--indent">
              <span className="contact__line-inner">
                people <em>actually</em> use.
              </span>
            </span>
          </h2>
          <p className="contact__copy">
            Open to remote work from anywhere — home base is Chattogram,
            Bangladesh.
          </p>
          <p className="contact__status">
            <span className="contact__pulse" aria-hidden="true" />
            Available for freelance &amp; remote roles
          </p>
          <p className="contact__langs">BN native · EN · HI · UR</p>
        </div>

        <div className="contact__block">
          <p className="contact__label">Email</p>
          <div className="contact__email-wrap">
            <a
              ref={(el) => {
                rows.current[0].el = el;
              }}
              className="contact__row contact__row--email"
              href={`mailto:${EMAIL}`}
              {...bindRow(0)}
            >
              <span className="contact__row-face">
                <span className="contact__email-text">{EMAIL}</span>
              </span>
              <span className="contact__row-fill" aria-hidden="true">
                <span className="contact__row-face">
                  <span className="contact__email-text">{EMAIL}</span>
                </span>
              </span>
            </a>
            <button
              type="button"
              className={cx("contact__copy-btn", copied && "is-copied")}
              onClick={copyEmail}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <p className="contact__label">Elsewhere</p>
          <ul className="contact__socials">
            {SOCIALS.map((social, i) => (
              <li key={social.id}>
                <a
                  ref={(el) => {
                    rows.current[i + 1].el = el;
                  }}
                  className="contact__row"
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...bindRow(i + 1)}
                >
                  <span className="contact__row-face">
                    {socialContent(social)}
                  </span>
                  <span className="contact__row-fill" aria-hidden="true">
                    <span className="contact__row-face">
                      {socialContent(social)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

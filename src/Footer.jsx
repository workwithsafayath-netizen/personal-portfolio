import { useEffect, useState } from "react";
import "./Footer.css";

/**
 * Footer — rendered by App as a sibling OUTSIDE <main> (main's intro
 * transform would break sticky/fixed descendants).
 *
 * The giant "SAFAYATH." wordmark is position: sticky to the bottom:
 * while the footer's body scrolls, the wordmark pins to the viewport's
 * lower edge and rides up like a curtain, then settles into its final
 * resting place at the end of the page. It scales with the viewport
 * width so the whole name fills one line at every breakpoint.
 */

const NAV = [
  { label: "The Reveal", href: "#hero-reveal" },
  { label: "The Thesis", href: "#hero" },
  { label: "What I Do", href: "#roles" },
  { label: "Works", href: "#featured-works" },
  { label: "Contact", href: "#contact" },
];

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/MD.safayath.rahman" },
  { label: "Instagram", href: "https://www.instagram.com/vintayath/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/safayath-rahman/" },
];

const ext = { target: "_blank", rel: "noopener noreferrer" };

export default function Footer() {
  const [time, setTime] = useState("");

  /* Chattogram wall clock — Asia/Dhaka, GMT+6, no DST. */
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
    });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = window.setInterval(update, 60000);
    return () => window.clearInterval(id);
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__body">
        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
            <p className="footer__sign">SAFAYATH —</p>
            <p className="footer__blurb">
              Safayath Rahman Tamzid. Self-taught, AI-assisted graphic
              designer and prompt-based web developer — shipping from
              Chattogram to anywhere.
            </p>
            <p className="footer__langs">BN native · EN · HI · UR</p>
          </div>

          <nav className="footer__col" aria-label="Site index">
            <p className="footer__col-title">Index</p>
            <ul className="footer__list">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <p className="footer__col-title">Elsewhere</p>
            <ul className="footer__list">
              {SOCIALS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} {...ext}>
                    {item.label}
                    <span className="footer__ext" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <p className="footer__col-title">Contact</p>
            <ul className="footer__list">
              <li>
                <a href="mailto:workwithsafayath@gmail.com">
                  workwithsafayath@gmail.com
                </a>
              </li>
              <li className="footer__plain">Chattogram, Bangladesh</li>
              <li className="footer__plain">
                Local time — <span className="footer__clock" aria-live="off" aria-atomic="true">{time || "…"}</span>{" "}
                GMT+6
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__meta">
          <p>© {year} Safayath Rahman Tamzid</p>
        </div>
      </div>

      {/* The sticky curtain — click to glide back to the top. */}
      <a
        className="footer__mark"
        href="#hero-reveal"
        aria-label="Back to top"
      >
        <span className="footer__mark-top" aria-hidden="true">
          <span className="footer__mark-hint">
            Back to top
            <svg viewBox="0 0 12 12" width="10" height="10">
              <path
                d="M6 10V2M2.5 5.5 6 2l3.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span className="footer__mark-text" aria-hidden="true">
          SAFAYATH<em>.</em>
        </span>
      </a>
    </footer>
  );
}

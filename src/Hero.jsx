import "./Hero.css";

/**
 * Hero — the thesis statement. Big editorial type, set left with a
 * staggered second line; static by design (no scroll choreography yet).
 *
 * HEADLINE: option 1 of three proposed is set below. The break and the
 * accent word are typographic decisions — when another option is picked,
 * re-set it inside the <h1> block; nothing else in the section changes.
 */
export default function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-heading">
      <div className="hero__inner">
        <p className="hero__kicker">The thesis</p>

        {/* ── Headline — swap here ─────────────────────────────────── */}
        <h1 className="hero__headline" id="hero-heading">
          <span className="hero__line">Design that</span>
          <span className="hero__line hero__line--indent">
            thinks like{" "}
            <span className="hero__accent">
              code<span className="hero__period">.</span>
            </span>
            <span className="hero__caret" aria-hidden="true" />
          </span>
        </h1>
        {/* ─────────────────────────────────────────────────────────── */}

        <p className="hero__subtext">
          Self-taught, AI-assisted, and shipping like a studio of one — a
          human eye up front, machine pace underneath.{" "}
          <strong>I write the intent; the tools do the typing.</strong>
        </p>

        <ul className="hero__facts">
          <li>AI-assisted design</li>
          <li>Prompt-based dev</li>
          <li>Founder · Velrobd.shop</li>
        </ul>
      </div>
    </section>
  );
}

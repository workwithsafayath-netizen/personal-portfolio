import { useEffect, useRef, useState } from "react";
import "./DiveIntro.css";

/**
 * DiveIntro — the transitional beat between the pinned hero and the
 * thesis. A warm gradient field, one big line, one scroll cue.
 *
 * On scroll into view the heading runs a gradient texture clipped
 * inside the letterforms for ~1.2s, then settles into a solid fill.
 * Reduced motion skips straight to the solid fill. No pinning here —
 * the hero-shift / dive-section pairing in HeroReveal.css owns that.
 */
export default function DiveIntro() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="dive-intro"
      ref={ref}
      className={`dive-section${inView ? " is-in" : ""}`}
      aria-label="Transition into the portfolio"
    >
      <h2 className="dive-section__title">Let&rsquo;s dive in</h2>

      <div className="dive-section__cue" aria-hidden="true">
        <span className="dive-section__dot" />
        <span className="dive-section__line" />
      </div>
    </section>
  );
}

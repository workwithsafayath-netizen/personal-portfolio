import { useEffect, useState } from "react";
import "./IntroLoader.css";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * IntroLoader — the name SAFAYATH wipes itself in like a pen line
 * (clip-path reveal on the display face), holds for a beat, then the
 * whole panel lifts off the top of the viewport.
 *
 * Contract with App.jsx (kept on every rewrite):
 *   1. call onComplete() exactly once, when the intro is finished;
 *   2. unmount itself on animationend — never a setTimeout;
 *   3. render nothing and release immediately when the OS asks for
 *      reduced motion (checked at mount; App separately watches the
 *      preference live for the rest of the session).
 *
 * The reveal is a single left-to-right wipe: the name writes itself
 * in, the accent period pops as the pen lifts, and the lift keyframe
 * is what unmounts the loader.
 */
export default function IntroLoader({ onComplete }) {
  const [gone, setGone] = useState(
    () => window.matchMedia(REDUCED_QUERY).matches
  );

  useEffect(() => {
    if (gone) onComplete();
  }, [gone, onComplete]);

  if (gone) return null;

  return (
    <div
      className="intro-loader"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        /* animationend bubbles — the stroke, caption, dot and glow all
           finish before the lift does. Only the panel lift may unmount
           the loader, so match on its keyframe name explicitly. */
        if (event.animationName === "srt-lift") setGone(true);
      }}
    >
      <div className="intro-loader__stage">
        <h1 className="intro-loader__name">
          SAFAYATH
          {/* accent period — pops once the pen lifts */}
          <span className="intro-loader__dot" />
        </h1>

        <p className="intro-loader__caption">Chattogram — open to remote</p>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useContent } from "./content";
import "./HeroReveal.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const CURSOR_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * HeroReveal — full-bleed portrait, two selves.
 *
 * Image sources come from the content store (admin-managed): base =
 * hoodie, top = Spider-Man suit. The reveal itself is the reference
 * mechanism: a 200vh scroll runway pins the sticky viewport while the
 * section dims and yields to the dive section; on cursor devices the
 * suit shows through an amoeba-distorted mask that breathes via
 * animated feTurbulence, ringed by a glowing white edge. Enter/Space
 * forces the full reveal. Touch devices mount only the base photo —
 * no second image, no mask, no filter.
 */
export default function HeroReveal() {
  const { hero } = useContent();
  const stageRef = useRef(null);
  const [active, setActive] = useState(false); // pointer is over the stage
  const [forced, setForced] = useState(false); // keyboard full reveal
  const [reduce, setReduce] = useState(
    () => window.matchMedia(REDUCED_QUERY).matches
  );
  const [canCursor, setCanCursor] = useState(
    () => window.matchMedia(CURSOR_QUERY).matches
  );

  /* Live OS toggles for both preferences. */
  useEffect(() => {
    const rm = window.matchMedia(REDUCED_QUERY);
    const cm = window.matchMedia(CURSOR_QUERY);
    const onReduce = () => setReduce(rm.matches);
    const onCursor = () => setCanCursor(cm.matches);
    rm.addEventListener("change", onReduce);
    cm.addEventListener("change", onCursor);
    return () => {
      rm.removeEventListener("change", onReduce);
      cm.removeEventListener("change", onCursor);
    };
  }, []);

  /* Scroll runway: the sticky stage dims as it is consumed, then hands
     the viewport to the dive section pulled up beneath it. */
  useEffect(() => {
    if (reduce) return undefined;
    const section = stageRef.current?.parentElement;
    const runway = section?.parentElement;
    if (!section || !runway) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: runway,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          const e = p * p;
          section.style.filter = `brightness(${(1 - e * 0.55).toFixed(3)})`;
          section.style.visibility = p >= 1 ? "hidden" : "visible";
          section.style.pointerEvents = p > 0.5 ? "none" : "";
        }
      });
    });

    return () => {
      ctx.revert();
      section.style.filter = "";
      section.style.visibility = "";
      section.style.pointerEvents = "";
    };
  }, [reduce]);

  const setPos = useCallback((clientX, clientY) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${clientX - rect.left}px`);
    el.style.setProperty("--my", `${clientY - rect.top}px`);
  }, []);

  const onMouseEnter = useCallback(
    (e) => {
      setPos(e.clientX, e.clientY);
      setActive(true);
    },
    [setPos]
  );
  const onMouseMove = useCallback(
    (e) => setPos(e.clientX, e.clientY),
    [setPos]
  );
  const onMouseLeave = useCallback(() => setActive(false), []);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      setForced((f) => !f);
    }
  }, []);

  const isTouchDevice = !canCursor;

  return (
    <div className="hero-shift" id="hero-reveal">
      <section
        className="reveal-section"
        aria-labelledby="hero-reveal-name"
      >
        <button
          ref={stageRef}
          type="button"
          className={`reveal${active ? " is-active" : ""}${
            forced ? " is-forced" : ""
          }`}
          aria-pressed={forced}
          aria-label={
            forced
              ? "Suit revealed — press to hide"
              : "Move the pointer to reveal the suit, or press to reveal it fully"
          }
          onMouseEnter={isTouchDevice ? undefined : onMouseEnter}
          onMouseMove={isTouchDevice ? undefined : onMouseMove}
          onMouseLeave={isTouchDevice ? undefined : onMouseLeave}
          onKeyDown={isTouchDevice ? undefined : onKeyDown}
          tabIndex={isTouchDevice ? -1 : 0}
        >
          {/* Base layer — admin-managed source. */}
          <img
            className="reveal-img reveal-base"
            src={hero.hoodie}
            alt="Safayath Rahman Tamzid in a plain dark hoodie, three-quarter side angle, against a flat warm orange background"
            draggable={false}
          />

          {/* Reveal layer + amoeba mask — cursor devices only; touch
              never mounts the image, the mask, or the filter. */}
          {canCursor && hero.spiderman && (
            <>
              <img
                className="reveal-img reveal-top"
                src={hero.spiderman}
                alt=""
                aria-hidden="true"
                draggable={false}
              />

              <svg
                className="reveal-shape"
                aria-hidden="true"
                focusable="false"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter
                    id="amoebaDistort"
                    x="-60%"
                    y="-60%"
                    width="220%"
                    height="220%"
                    colorInterpolationFilters="sRGB"
                  >
                    <feTurbulence
                      type="turbulence"
                      baseFrequency="0.013"
                      numOctaves="2"
                      seed="4"
                      result="noise"
                    >
                      {!reduce && (
                        <animate
                          attributeName="baseFrequency"
                          dur="12s"
                          values="0.009;0.018;0.012;0.009"
                          repeatCount="indefinite"
                        />
                      )}
                    </feTurbulence>
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="60"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                  <mask id="revealMask">
                    <g filter="url(#amoebaDistort)">
                      <circle className="reveal-mask-shape" fill="#fff" />
                    </g>
                  </mask>
                </defs>

                <g className="reveal-edge-glow">
                  <circle
                    className="reveal-edge"
                    filter="url(#amoebaDistort)"
                  />
                </g>
              </svg>
            </>
          )}

          <span className="reveal-scrim reveal-scrim-top" aria-hidden="true" />
          <span
            className="reveal-scrim reveal-scrim-bottom"
            aria-hidden="true"
          />
        </button>

        {/* Overlay sits beside the button (not inside it) so the name
            stays a real heading; pointer-events off keeps the stage
            fully interactive beneath it. */}
        <div className="reveal-overlay">
          <h2 className="reveal-name" id="hero-reveal-name">
            Safayath Rahman
          </h2>
        </div>
      </section>
    </div>
  );
}

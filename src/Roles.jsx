import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useContent } from "./content";
import "./Roles.css";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const CURSOR_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * Roles — a hover/tap index of the disciplines, driven by the content
 * store (managed from the admin panel at #/admin).
 *
 * The proof-of-work image trails the cursor with a lerped lag. On
 * pointer-enter the float snaps to the cursor FIRST, then fades in —
 * position before fade, no top-left flash.
 *
 * Floats are portaled to <body>: <main> carries the intro transform,
 * which would turn position:fixed into document-relative anchoring.
 *
 * Reduced motion: the image still appears but tracks 1:1, no trail.
 */
export default function Roles() {
  const { roles, rolesLoaded } = useContent();

  const [hovered, setHovered] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const [focused, setFocused] = useState(-1);
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED_QUERY).matches
  );
  /* Cursor vs touch decides the whole interaction: hover-trail on
     pointer devices, a transient tap preview on touch. */
  const [canCursor, setCanCursor] = useState(
    () => window.matchMedia(CURSOR_QUERY).matches
  );

  const floatRefs = useRef([]);
  const hoveredRef = useRef(-1);
  const pinTimer = useRef(null);
  /* Mutable tracking state — outside React on purpose. */
  const motion = useRef({ tx: 0, ty: 0, x: 0, y: 0, frame: null });

  useEffect(() => {
    const rm = window.matchMedia(REDUCED_QUERY);
    const cm = window.matchMedia(CURSOR_QUERY);
    const onReduce = (event) => setReduced(event.matches);
    const onCursor = (event) => setCanCursor(event.matches);
    rm.addEventListener("change", onReduce);
    cm.addEventListener("change", onCursor);
    return () => {
      rm.removeEventListener("change", onReduce);
      cm.removeEventListener("change", onCursor);
    };
  }, []);

  /* Touch safety net: any scroll kills the preview, so the image can
     never linger on screen after the user moves on. */
  useEffect(() => {
    const clear = () => {
      setPinned(-1);
      setHovered(-1);
      hoveredRef.current = -1;
    };
    const onScroll = () => {
      if (!canCursor) clear();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [canCursor]);

  useEffect(
    () => () => {
      if (pinTimer.current) window.clearTimeout(pinTimer.current);
    },
    []
  );

  const placeFloat = (index, x, y) => {
    const el = floatRefs.current[index];
    if (!el) return;
    el.style.setProperty("--fx", `${x}px`);
    el.style.setProperty("--fy", `${y}px`);
  };

  const tick = () => {
    const m = motion.current;
    m.x += (m.tx - m.x) * 0.14;
    m.y += (m.ty - m.y) * 0.14;
    placeFloat(hoveredRef.current, m.x, m.y);

    if (Math.abs(m.tx - m.x) > 0.1 || Math.abs(m.ty - m.y) > 0.1) {
      m.frame = requestAnimationFrame(tick);
    } else {
      m.frame = null;
    }
  };

  const aim = (clientX, clientY) => {
    const m = motion.current;
    m.tx = clientX;
    m.ty = clientY;
    if (reduced) {
      placeFloat(hoveredRef.current, clientX, clientY);
      return;
    }
    if (m.frame === null) m.frame = requestAnimationFrame(tick);
  };

  useEffect(
    () => () => {
      if (motion.current.frame !== null) {
        cancelAnimationFrame(motion.current.frame);
        motion.current.frame = null;
      }
    },
    []
  );

  const handleEnter = (index) => (event) => {
    const m = motion.current;
    m.x = m.tx = event.clientX;
    m.y = m.ty = event.clientY;
    hoveredRef.current = index;
    placeFloat(index, m.x, m.y);
    setHovered(index);
    if (!reduced && m.frame === null) m.frame = requestAnimationFrame(tick);
  };

  const handleLeave = () => {
    hoveredRef.current = -1;
    setHovered(-1);
  };

  const handleClick = (index) => () => {
    if (canCursor) {
      /* Desktop: click pins/unpins until dismissed. */
      setPinned((current) => (current === index ? -1 : index));
      return;
    }
    /* Touch: a transient preview — centered, self-dismissing. Tapping
       another row swaps it; the same row, a scroll, or the timeout all
       hide it, so nothing can stick. */
    setPinned(index);
    if (pinTimer.current) window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => setPinned(-1), 2800);
  };

  const handleFocus = (index) => (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.left + rect.width * 0.7, window.innerWidth - 210);
    const y = rect.top + rect.height / 2;
    motion.current.x = motion.current.tx = x;
    motion.current.y = motion.current.ty = y;
    hoveredRef.current = index;
    placeFloat(index, x, y);
    setFocused(index);
  };

  const handleBlur = () => setFocused(-1);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") setPinned(-1);
  };

  return (
    <section
      id="roles"
      className="roles"
      aria-labelledby="roles-heading"
      onMouseMove={(event) => aim(event.clientX, event.clientY)}
      onKeyDown={handleKeyDown}
      onTouchEnd={() => {
        setHovered(-1);
        hoveredRef.current = -1;
      }}
      onTouchCancel={() => {
        setHovered(-1);
        hoveredRef.current = -1;
      }}
    >
      <div className="roles__inner">
        <header className="roles__head">
          <div>
            <p className="roles__kicker">What I do</p>
            <h2 className="roles__title" id="roles-heading">
              {roles.length} disciplines,
              <br />
              one pipeline.
            </h2>
          </div>
          <p className="roles__standfirst">
            Design feeds the brand, the brand needed a site, the site taught
            me to ship. Hover a line — the proof follows your cursor.
          </p>
        </header>

        {!rolesLoaded ? (
          <ul className="roles__list" aria-busy="true" aria-label="Loading roles">
            {[0, 1, 2].map((i) => (
              <li className="roles__item" key={i}>
                <div className="roles__row">
                  <span className="skel roles__skel-chip" />
                  <span className="roles__body">
                    <span className="skel roles__skel-line" />
                    <span className="skel roles__skel-line roles__skel-line--short" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="roles__list">
          {roles.map((role, index) => {
            const active =
              hovered === index || pinned === index || focused === index;
            return (
              <li
                key={role.id}
                className={cx(
                  "roles__item",
                  active && "is-active",
                  pinned === index && "is-open"
                )}
              >
                <button
                  type="button"
                  className="roles__row"
                  aria-pressed={pinned === index}
                  aria-label={`${role.title} — pin the preview image`}
                  onMouseEnter={handleEnter(index)}
                  onMouseLeave={handleLeave}
                  onClick={handleClick(index)}
                  onFocus={handleFocus(index)}
                  onBlur={handleBlur}
                >
                  <span className="roles__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="roles__body">
                    <span className="roles__name">{role.title}</span>
                    <span className="roles__desc">{role.desc}</span>
                    {role.tags?.length > 0 && (
                      <span className="roles__tags" aria-hidden="true">
                        {role.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="roles__arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        )}
      </div>

      {/* Trailing proof images — portaled to <body> (see header). */}
      {createPortal(
        <div className="roles__floats" aria-hidden="true">
          {roles.map((role, index) => (
            <figure
              key={role.id}
              className={cx(
                "roles__float",
                (hovered === index ||
                  pinned === index ||
                  focused === index) &&
                  "is-visible",
                pinned === index && "is-pinned",
                !canCursor && "is-fixed"
              )}
              style={{ "--tilt": index % 2 ? "-2.2deg" : "2.6deg" }}
              ref={(el) => {
                floatRefs.current[index] = el;
              }}
            >
              <div className="roles__float-inner">
                {role.img ? (
                  <img src={role.img} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="roles__float-mark">SAFAYATH</span>
                )}
              </div>
            </figure>
          ))}
        </div>,
        document.body
      )}
    </section>
  );
}

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useContent } from "./content";
import "./FeaturedWorks.css";

gsap.registerPlugin(ScrollTrigger);

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* Sketch fallbacks cycle when a work has no screenshot yet. */
const FALLBACK_THEMES = ["health", "snackza", "fitness", "ember"];
const themeFor = (work, index) =>
  work.theme || FALLBACK_THEMES[index % FALLBACK_THEMES.length];

/* Palette-faithful sketch per theme — pure CSS, aria-hidden, stands in
   until a real screenshot is uploaded from the admin panel. Exported
   so the All Works page can reuse it. */
export function WorkSketch({ theme }) {
  if (theme === "health") {
    return (
      <div className="work__sketch work__sketch--health" aria-hidden="true">
        <span className="sk sk-health__topbar">
          <i />
          <i />
          <i />
        </span>
        <span className="sk sk-health__lead" />
        <span className="sk sk-health__sub" />
        <span className="sk-health__cards">
          <i />
          <i />
          <i />
        </span>
        <span className="sk-health__dots">
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  }
  if (theme === "snackza") {
    return (
      <div className="work__sketch work__sketch--snackza" aria-hidden="true">
        <span className="sk-snackza__nav">
          <i />
          <i />
        </span>
        <p className="sk-snackza__headline">
          Shot to make
          <br />
          you <em>hungry.</em>
        </p>
        <span className="sk-snackza__plate" />
        <span className="sk-snackza__pill">Order now</span>
      </div>
    );
  }
  if (theme === "fitness") {
    return (
      <div className="work__sketch work__sketch--fitness" aria-hidden="true">
        <span className="sk-fitness__slash" />
        <p className="sk-fitness__headline">
          Train hard.
          <br />
          Get results. <em>Fast.</em>
        </p>
        <span className="sk-fitness__meta">
          <i />
          <b>CTG</b>
        </span>
      </div>
    );
  }
  if (theme === "ember") {
    return (
      <div className="work__sketch work__sketch--ember" aria-hidden="true">
        <span className="sk-ember__glow" />
        <p className="sk-ember__wordmark">
          Ember <i>Essence</i>
          <span>Fine dining · Est. Chattogram</span>
        </p>
        <span className="sk-ember__gallery">
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  }
  return (
    <div className="work__sketch work__sketch--blank" aria-hidden="true">
      <span className="sk-blank__mark">SAFAYATH</span>
    </div>
  );
}

function WorkCard({ work, index }) {
  return (
    <article className="work">
      <div className={cx("work__media", !work.image && "work__media--slot")}>
        {work.image ? (
          <img
            className="work__img"
            src={work.image}
            alt={`${work.name} — screenshot of the live site`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <WorkSketch theme={themeFor(work, index)} />
        )}
      </div>

      <div className="work__body">
        <p className="work__meta">
          <span className="work__index">{String(index + 1).padStart(2, "0")}</span>
          <span className="work__category">{work.category}</span>
        </p>
        <h3 className="work__name">{work.name}</h3>
        <p className="work__desc">{work.desc}</p>
        {work.url && work.url !== "#" && (
          <a
            className="work__link"
            href={work.url}
            target="_blank"
            rel="noreferrer"
          >
            View Details
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
          </a>
        )}
      </div>
    </article>
  );
}

export default function FeaturedWorks() {
  const { works, worksLoaded, worksEmpty } = useContent();
  const sectionRef = useRef(null);

  /* Featured first, capped at four; if nothing is flagged yet, show
     the first four so the homepage is never empty. */
  const flagged = works.filter((w) => w.featured);
  const featured = (flagged.length ? flagged : works).slice(0, 4);
  const extra = works.length - featured.length;

  /* Scroll reveals — gated on no-preference, live-re-run via matchMedia. */
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.from(".works__line-inner", {
          yPercent: 118,
          duration: 0.95,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 74%" },
        });
        gsap.from(".works__standfirst", {
          opacity: 0,
          y: 22,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        });
        gsap.from(".work", {
          opacity: 0,
          y: 54,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.13,
          scrollTrigger: { trigger: ".works__grid", start: "top 80%" },
        });
        gsap.from(".works__more", {
          opacity: 0,
          y: 26,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: ".works__more", start: "top 92%" },
        });
      }, sectionRef);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="featured-works"
      className="works"
      aria-labelledby="works-heading"
    >
      <div className="works__inner">
        <header className="works__head">
          <div>
            <p className="works__kicker">Featured works</p>
            <h2 className="works__title" id="works-heading">
              <span className="works__line">
                <span className="works__line-inner">Shipped,</span>
              </span>
              <span className="works__line works__line--indent">
                <span className="works__line-inner">
                  not <em>shelved.</em>
                </span>
              </span>
            </h2>
          </div>
          <p className="works__standfirst">
            Four live builds — from clinical calm to midnight appetite.
            Each one went from prompt to production.
          </p>
        </header>

        {!worksLoaded ? (
          <div className="works__grid" aria-busy="true" aria-label="Loading works">
            {[0, 1, 2, 3].map((i) => (
              <div className="work" key={i}>
                <div className="work__media skel" />
                <div className="skel works__skel-line" />
                <div className="skel works__skel-line works__skel-line--short" />
              </div>
            ))}
          </div>
        ) : worksEmpty ? (
          <p className="works__empty">
            Nothing published yet — works added from the admin panel will
            appear here.
          </p>
        ) : (
          <>
            <div className="works__grid">
              {featured.map((project, i) => (
                <WorkCard key={project.id} work={project} index={i} />
              ))}
            </div>

            <a className="works__more" href="#/works">
              <span className="works__more-label">More works</span>
              <span className="works__more-count">
                {extra > 0
                  ? `+${extra} more on the full index`
                  : `All ${works.length} on the full index`}
              </span>
              <span className="works__more-arrow" aria-hidden="true">
                →
              </span>
            </a>
          </>
        )}
      </div>
    </section>
  );
}

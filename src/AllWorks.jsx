import { useContent } from "./content";
import { WorkSketch } from "./FeaturedWorks";
import "./AllWorks.css";

/* Sketch fallbacks cycle when a work has no screenshot yet. */
const FALLBACK_THEMES = ["health", "snackza", "fitness", "ember"];
const themeFor = (work, index) =>
  work.theme || FALLBACK_THEMES[index % FALLBACK_THEMES.length];

/*
 * AllWorks — the full index, routed at #/works. Every work in the
 * Firestore "works" collection, in order, with the same card anatomy as
 * the home page. Cards enter on a CSS stagger; the global reduced-motion
 * guard flattens it.
 */
export default function AllWorks() {
  const { works, worksLoaded, worksEmpty } = useContent();

  return (
    <div className="allworks" data-lenis-prevent>
      <header className="allworks__bar">
        <a className="allworks__back" href="#/">
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
            <path
              d="M10 6H2M5.5 2.5 2 6l3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to site
        </a>
        <span className="allworks__count">
          {worksLoaded ? (works.length === 1 ? "1 work" : `${works.length} works`) : "…"}
        </span>
      </header>

      <div className="allworks__inner">
        <p className="allworks__kicker">The full index</p>
        <h1 className="allworks__title">
          Everything shipped,
          <br />
          <em>not shelved.</em>
        </h1>
        <p className="allworks__standfirst">
          From clinical calm to midnight appetite — each one went from
          prompt to production.
        </p>

        {!worksLoaded ? (
          <div
            className="allworks__grid"
            aria-busy="true"
            aria-label="Loading works"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="awork" key={i}>
                <div className="awork__media skel" />
                <div className="skel allworks__skel-line" />
                <div className="skel allworks__skel-line allworks__skel-line--short" />
              </div>
            ))}
          </div>
        ) : worksEmpty ? (
          <p className="allworks__empty">
            Nothing published yet — works added from the admin panel will
            appear here.
          </p>
        ) : (
        <div className="allworks__grid">
          {works.map((work, i) => (
            <article
              className="awork"
              key={work.id}
              style={{ "--i": i }}
            >
              <div
                className={`awork__media ${
                  work.image ? "" : "awork__media--slot"
                }`}
              >
                {work.image ? (
                  <img
                    className="awork__img"
                    src={work.image}
                    alt={`${work.name} — screenshot of the live site`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <WorkSketch theme={themeFor(work, i)} />
                )}
              </div>
              <div className="awork__body">
                <p className="awork__meta">
                  <span className="awork__index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="awork__category">{work.category}</span>
                </p>
                <h2 className="awork__name">{work.name}</h2>
                <p className="awork__desc">{work.desc}</p>
                {work.url && work.url !== "#" && (
                  <a
                    className="awork__link"
                    href={work.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View live
                    <svg
                      viewBox="0 0 12 12"
                      width="11"
                      height="11"
                      aria-hidden="true"
                    >
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
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./firebase";
import portraitHoodie from "./assets/safayath-hoodie.png";
import portraitSpiderman from "./assets/suite-text.png";
import roleDesign from "./assets/role-design.jpg";
import roleDev from "./assets/role-dev.jpg";
import roleCommerce from "./assets/role-commerce.jpg";

/*
 * Content store — Firestore is the source of truth; bundled defaults are
 * the pre-fetch fallback AND the safety net while the database is still
 * empty (first run, before the owner saves anything from the admin) or
 * unreachable. The public site therefore never renders blank.
 *
 * Firestore shape:
 *   hero/main  → { baseImageUrl, revealImageUrl }
 *   roles/*    → { title, description, tags: [], imageUrl, order }
 *   works/*    → { title, description, imageUrl, liveUrl, category,
 *                  order, featured }
 *
 * Components consume a normalized shape: roles { id, title, desc, tags,
 * img }, works { id, name, category, desc, url, image, featured }.
 */

export const DEFAULT_HERO = {
  hoodie: portraitHoodie,
  spiderman: portraitSpiderman,
};

export const DEFAULT_ROLES = [
  {
    id: "role-design",
    title: "AI-Assisted Graphic Design",
    desc: "Posters, banners, and product visuals — art-directed by a human eye, accelerated by models. The taste is mine; the hours are the machine's.",
    tags: ["Posters", "Banners", "Product visuals"],
    img: roleDesign,
  },
  {
    id: "role-dev",
    title: "Prompt-Based Web Development",
    desc: "Interfaces built from precise plain-language intent — I write the spec, steer the generation, and hand-finish until it ships.",
    tags: ["Interfaces", "Prototypes", "This site"],
    img: roleDev,
  },
  {
    id: "role-commerce",
    title: "E-commerce & Brand Operations",
    desc: "Founded and ran Velrobd.shop, an online clothing brand, for about a year — product planning, marketing, sales, and every customer message in between.",
    tags: ["Product planning", "Marketing", "Sales", "Support"],
    img: roleCommerce,
  },
];

export const DEFAULT_WORKS = [
  {
    id: "work-healthcare",
    name: "Healthcare Services",
    category: "Web design · UI",
    desc: "Hospital platform for imaging, cardiology and gynecology — clean clinical white and teal with a card carousel.",
    url: "#",
    image: null,
    featured: true,
  },
  {
    id: "work-snackza",
    name: "Snackza",
    category: "Brand · Food ordering",
    desc: "Food-ordering brand on deep green with a bold orange appetite and one job: make you hungry.",
    url: "#",
    image: null,
    featured: true,
  },
  {
    id: "work-fitness",
    name: "Fitness Fast",
    category: "Landing page · Gym",
    desc: "Chattogram gym site — black ground, loud sports type, built to convert resolve into memberships.",
    url: "#",
    image: null,
    featured: true,
  },
  {
    id: "work-ember",
    name: "Ember Essence",
    category: "Restaurant · Gallery",
    desc: "Upscale restaurant — a moody photo gallery in near-black with gold light and elegant serif lettering.",
    url: "#",
    image: null,
    featured: true,
  },
];

export function useContent() {
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [roles, setRoles] = useState(null); // null = still loading
  const [works, setWorks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const offs = [
      onSnapshot(
        doc(db, "hero", "main"),
        (snap) => {
          const d = snap.data();
          setHero(
            d && (d.baseImageUrl || d.revealImageUrl)
              ? {
                  hoodie: d.baseImageUrl || DEFAULT_HERO.hoodie,
                  spiderman: d.revealImageUrl || DEFAULT_HERO.spiderman,
                }
              : DEFAULT_HERO
          );
        },
        (err) => setError(err)
      ),
      onSnapshot(
        query(collection(db, "roles"), orderBy("order")),
        (snap) =>
          setRoles(
            snap.docs.map((s) => {
              const d = s.data();
              return {
                id: s.id,
                title: d.title ?? "",
                desc: d.description ?? "",
                tags: Array.isArray(d.tags) ? d.tags : [],
                img: d.imageUrl ?? null,
              };
            })
          ),
        (err) => setError(err)
      ),
      onSnapshot(
        query(collection(db, "works"), orderBy("order")),
        (snap) =>
          setWorks(
            snap.docs.map((s) => {
              const d = s.data();
              return {
                id: s.id,
                name: d.title ?? "",
                category: d.category ?? "",
                desc: d.description ?? "",
                url: d.liveUrl ?? "#",
                image: d.imageUrl ?? null,
                featured: !!d.featured,
              };
            })
          ),
        (err) => setError(err)
      ),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  return {
    hero,
    roles: roles ?? DEFAULT_ROLES,
    works: works ?? DEFAULT_WORKS,
    rolesLoaded: roles !== null,
    worksLoaded: works !== null,
    rolesEmpty: roles !== null && roles.length === 0,
    worksEmpty: works !== null && works.length === 0,
    error,
  };
}

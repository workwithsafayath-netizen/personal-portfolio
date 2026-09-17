/**
 * App — the thin conductor.
 *
 * Responsibilities, and nothing else:
 *   1. render IntroLoader and hear when the intro is done,
 *   2. own the single Lenis instance and wire it to ScrollTrigger,
 *   3. lock scrolling during the intro and release it after,
 *   4. list the sections in their canonical order.
 *
 * State budget: exactly two pieces — `introDone` (intro lifecycle /
 * scroll lock) and `reducedMotion` (live OS preference). Every section
 * is self-contained; nothing else lives here.
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import RouteView from "./RouteView";
import IntroLoader from "./IntroLoader";
import HeroReveal from "./HeroReveal";
import DiveIntro from "./DiveIntro";
import Hero from "./Hero";
import Roles from "./Roles";
import FeaturedWorks from "./FeaturedWorks";
import Contact from "./Contact";
import Footer from "./Footer";

gsap.registerPlugin(ScrollTrigger);

/**
 * Exponential ease-out: 1 − 2^(−10t), clamped to exactly 1 at t = 1 so the
 * interpolation lands flush instead of trailing off asymptotically. This is
 * the glide curve of the whole site — Lenis decays every wheel tick with it.
 */
export const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function App() {
  /* State piece 1 — has the intro finished? Drives the scroll lock. */
  const [introDone, setIntroDone] = useState(false);

  /* State piece 2 — prefers-reduced-motion, watched live (see below). */
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const lenisRef = useRef(null);

  /*
   * Reduced motion is re-checked on every OS toggle, not read once.
   * Flipping it tears down (or builds) Lenis via the effect below, so the
   * user gets native scroll the moment the OS preference changes.
   */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setReducedMotion(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /*
   * Lenis ↔ ScrollTrigger wiring.
   *
   * StrictMode double-mount safety: React 19 runs effects as
   * mount → cleanup → mount in development. The cleanup removes this
   * instance's callback from gsap.ticker and destroys the instance, so the
   * second mount starts from zero — no orphaned rAF, no doubled wheel
   * handling, no two Lenis fighting over <html>.
   */
  useEffect(() => {
    if (reducedMotion) {
      /* Respect the preference: no smoothing. ScrollTrigger falls back to
         native window scroll on its own, so triggers keep working. */
      lenisRef.current = null;
      return undefined;
    }

    const lenis = new Lenis({
      easing: expoOut,
      duration: 1.2,
      touchMultiplier: 1.5,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    /* Every Lenis scroll frame pushes ScrollTrigger's math forward — this
       is what keeps pins and scrubbed tweens glued to the smooth scroll. */
    lenis.on("scroll", ScrollTrigger.update);

    /* Drive Lenis from GSAP's ticker instead of its own rAF loop, so all
       animation shares one clock. Ticker time is seconds; Lenis wants ms. */
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    /* Lenis does its own interpolation — GSAP's lag smoothing would
       second-guess it and introduce jitter. */
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, [reducedMotion]);

  /*
   * Scroll lock during the intro, release after.
   * Two paths: Lenis present → stop()/start() (Lenis manages the
   * .lenis-stopped overflow rule itself). Reduced-motion path → no Lenis,
   * so lock <html> natively with an overflow utility instead.
   */
  useEffect(() => {
    const root = document.documentElement;

    if (introDone) {
      lenisRef.current?.start();
      root.classList.remove("overflow-hidden");
      /* Content just became scrollable — re-measure once so any pinned or
         triggered sections laid out while locked start from true numbers. */
      const refresh = gsap.delayedCall(0.35, () => ScrollTrigger.refresh());
      return () => refresh.kill();
    }

    if (lenisRef.current) {
      lenisRef.current.stop();
    } else {
      root.classList.add("overflow-hidden");
    }
    return undefined;
  }, [introDone, reducedMotion]);

  return (
    <>
      {/*
        Section order is canonical. IntroLoader renders first, inside
        <main>, and is contractually required to unmount itself before the
        reveal tween touches <main> — so it never sits inside a transformed
        ancestor while it is still on screen.
      */}
      <main id="main">
        <IntroLoader onComplete={() => setIntroDone(true)} />
        <HeroReveal />
        <DiveIntro />
        <Hero />
        <Roles />
        <FeaturedWorks />
        <Contact />
      </main>

      {/*
        WHY FOOTER LIVES OUTSIDE <main>:
        The intro reveal tween leaves an inline `transform` on <main>
        (GSAP does not strip it when the tween lands). A transformed
        ancestor becomes the containing block for position:fixed and, in
        practice, breaks position:sticky that is meant to pin against the
        viewport. The Footer stage hosts sticky elements — so <Footer />
        is rendered here, as a sibling of <main>, in normal document flow.
      */}
      <Footer />

      {/* Hash-routed overlays (#/admin, #/works) and the admin launcher.
          Lives here, outside <main>, beside the Footer. */}
      <RouteView />
    </>
  );
}

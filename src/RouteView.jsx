import { useEffect, useSyncExternalStore } from "react";
import Admin from "./Admin";
import AllWorks from "./AllWorks";

/*
 * RouteView — hash-based view switching without a router library.
 *   #/admin  → the content admin panel
 *   #/works  → the full works index
 *   anything else → the public site (this renders nothing but the
 *   launcher, which is how the owner reaches the admin).
 *
 * While a route is open, body scroll is locked so the underlying page
 * can't drift behind the overlay.
 */

const getHash = () => window.location.hash;
const subscribeHash = (cb) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export default function RouteView() {
  const hash = useSyncExternalStore(subscribeHash, getHash, getHash);

  const route =
    hash === "#/admin" ? "admin" : hash === "#/works" ? "works" : null;

  useEffect(() => {
    if (!route) return undefined;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [route]);

  /* No public entry point: the admin is reachable only by typing
     #/admin directly, where Firebase Auth gates it. */
  return (
    <>
      {route === "admin" && <Admin />}
      {route === "works" && <AllWorks />}
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { uploadImageToCloudinary } from "./cloudinary";
import { useContent } from "./content";
import "./Admin.css";

/*
 * Admin — owner-only control room at #/admin, backed by Firebase.
 * Auth: onAuthStateChange gates the whole panel; login is email +
 * password against an account created in the Firebase console (no
 * signup form). Content: Firestore reads/writes. Images: Cloudinary
 * only — the returned secure_url is what Firestore stores.
 */

const ArrowIcon = ({ up }) => (
  <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
    <path
      d={up ? "M6 10V2M2.5 5.5 6 2l3.5 3.5" : "M6 2v8M2.5 6.5 6 10l3.5-3.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
    <path
      d="M2 3.5h10M5.5 3.5V2.2a.7.7 0 0 1 .7-.7h1.6a.7.7 0 0 1 .7.7v1.3M3.5 3.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Spinner = () => (
  <span className="admin__spinner" aria-hidden="true" />
);

/* Upload-through-Cloudinary image field. */
function ImageField({ label, value, ratio, onFile, onClear }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      await onFile(file);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin__imgfield">
      <span className="admin__label">{label}</span>
      <div
        className={`admin__preview ${value ? "" : "is-empty"}`}
        style={{ aspectRatio: ratio }}
      >
        {value ? <img src={value} alt="" /> : <span className="admin__preview-note">No image yet</span>}
        {busy && (
          <span className="admin__preview-busy">
            <Spinner /> Uploading…
          </span>
        )}
      </div>
      <div className="admin__imgrow">
        <button
          type="button"
          className="admin__btn"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        {value && onClear && (
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={onClear}
            disabled={busy}
          >
            Remove
          </button>
        )}
        {failed && <span className="admin__imgerr">Upload failed — try again.</span>}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
      </div>
    </div>
  );
}

/* Owner-only login. No signup — the account lives in the console. */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
          ? "Wrong email or password."
          : err.code === "auth/too-many-requests"
          ? "Too many attempts — please wait before trying again."
          : "Could not sign in — check your connection."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin admin--gate">
      <form className="login" onSubmit={submit}>
        <p className="login__brand">
          SAFAYATH <em>·</em> Admin
        </p>
        <p className="login__note">Owner access only.</p>
        <label className="admin__field">
          <span className="admin__label">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="admin__field">
          <span className="admin__label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="login__error">{error}</p>}
        <button type="submit" className="admin__btn login__submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function Admin() {
  const content = useContent();
  const [user, setUser] = useState(undefined); // undefined = checking
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const flash = (msg, kind = "ok") => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const run = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) flash(okMsg);
    } catch {
      flash("Something went wrong — check Firestore rules / connection.", "err");
    }
  };

  /* ---- auth gate ---- */
  if (user === undefined) {
    return (
      <div className="admin admin--gate">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Login />;

  /* ---- hero ---- */
  const setHeroImage = (field) => async (file) => {
    const url = await uploadImageToCloudinary(file);
    await run(
      () => setDoc(doc(db, "hero", "main"), { [field]: url }, { merge: true }),
      "Hero image updated"
    );
  };
  const clearHeroImage = (field) => () =>
    run(
      () => updateDoc(doc(db, "hero", "main"), { [field]: null }),
      "Hero image removed"
    );

  /* ---- roles ---- */
  const rolesCol = collection(db, "roles");
  const addRole = () =>
    run(
      () =>
        addDoc(rolesCol, {
          title: "New role",
          description: "",
          tags: [],
          imageUrl: null,
          order: content.roles.length,
        }),
      "Role added"
    );
  const patchRole = (id, patch) => run(() => updateDoc(doc(db, "roles", id), patch));
  const delRole = (id) => run(() => deleteDoc(doc(db, "roles", id)), "Role deleted");
  const moveRole = (i, dir) => {
    const list = [...content.roles];
    const to = i + dir;
    if (to < 0 || to >= list.length) return;
    [list[i], list[to]] = [list[to], list[i]];
    run(() => {
      const batch = writeBatch(db);
      list.forEach((r, idx) => batch.update(doc(db, "roles", r.id), { order: idx }));
      return batch.commit();
    }, "Order saved");
  };
  const roleImage = (id) => async (file) => {
    const url = await uploadImageToCloudinary(file);
    await run(() => updateDoc(doc(db, "roles", id), { imageUrl: url }), "Role image updated");
  };

  /* ---- works ---- */
  const worksCol = collection(db, "works");
  const addWork = () =>
    run(
      () =>
        addDoc(worksCol, {
          title: "New project",
          description: "One-line description.",
          imageUrl: null,
          liveUrl: "#",
          category: "Category",
          order: content.works.length,
          featured: false,
        }),
      "Work added"
    );
  const patchWork = (id, patch) => run(() => updateDoc(doc(db, "works", id), patch));
  const delWork = (id) => run(() => deleteDoc(doc(db, "works", id)), "Work deleted");
  const moveWork = (i, dir) => {
    const list = [...content.works];
    const to = i + dir;
    if (to < 0 || to >= list.length) return;
    [list[i], list[to]] = [list[to], list[i]];
    run(() => {
      const batch = writeBatch(db);
      list.forEach((w, idx) => batch.update(doc(db, "works", w.id), { order: idx }));
      return batch.commit();
    }, "Order saved");
  };
  const workImage = (id) => async (file) => {
    const url = await uploadImageToCloudinary(file);
    await run(() => updateDoc(doc(db, "works", id), { imageUrl: url }), "Work image updated");
  };

  return (
    <div className="admin" data-lenis-prevent>
      <header className="admin__bar">
        <p className="admin__brand">
          SAFAYATH <em>·</em> Site Admin
        </p>
        <div className="admin__actions">
          <span className="admin__who">{user.email}</span>
          <a className="admin__link" href="#/">
            View site
          </a>
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => signOut(auth)}
          >
            Sign out
          </button>
        </div>
      </header>

      {content.error && (
        <p className="admin__banner">
          Live sync hit a problem — showing bundled fallback content. Check
          Firestore rules and your connection.
        </p>
      )}

      <main className="admin__main">
        {/* ---------------- Hero ---------------- */}
        <section className="admin__panel">
          <h2 className="admin__title">Hero portraits</h2>
          <p className="admin__note">
            The two full-bleed layers of the opening section. Uploads go to
            Cloudinary; the URL is saved to Firestore.
          </p>
          <div className="admin__duo">
            <ImageField
              label="Base — hoodie"
              ratio="16 / 9"
              value={content.hero.hoodie}
              onFile={setHeroImage("baseImageUrl")}
              onClear={clearHeroImage("baseImageUrl")}
            />
            <ImageField
              label="Reveal — Spider-Man suit"
              ratio="16 / 9"
              value={content.hero.spiderman}
              onFile={setHeroImage("revealImageUrl")}
              onClear={clearHeroImage("revealImageUrl")}
            />
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section className="admin__panel">
          <h2 className="admin__title">What I do</h2>
          <p className="admin__note">
            The roles index. Add as many as you need — the trailing proof
            image follows the cursor on desktop.
          </p>

          {!content.rolesLoaded ? (
            <div className="admin__stack">
              {[0, 1, 2].map((i) => (
                <div className="admin__card" key={i}>
                  <div className="skel admin__skel-line" />
                  <div className="skel admin__skel-line admin__skel-line--short" />
                  <div className="skel admin__skel-box" />
                </div>
              ))}
            </div>
          ) : content.rolesEmpty ? (
            <p className="admin__empty">No roles yet — add the first one below.</p>
          ) : (
            <div className="admin__stack">
              {content.roles.map((role, i) => (
                <div className="admin__card" key={role.id}>
                  <div className="admin__card-head">
                    <span className="admin__badge">{String(i + 1).padStart(2, "0")}</span>
                    <span className="admin__card-title">{role.title || "Untitled role"}</span>
                    <span className="admin__spacer" />
                    <button type="button" className="admin__icon" disabled={i === 0} aria-label="Move up" onClick={() => moveRole(i, -1)}>
                      <ArrowIcon up />
                    </button>
                    <button type="button" className="admin__icon" disabled={i === content.roles.length - 1} aria-label="Move down" onClick={() => moveRole(i, 1)}>
                      <ArrowIcon />
                    </button>
                    <button type="button" className="admin__icon admin__icon--danger" aria-label="Delete role" onClick={() => delRole(role.id)}>
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="admin__fields">
                    <label className="admin__field">
                      <span className="admin__label">Title</span>
                      <input
                        defaultValue={role.title}
                        key={`${role.id}-title`}
                        onBlur={(e) => patchRole(role.id, { title: e.target.value })}
                      />
                    </label>
                    <label className="admin__field">
                      <span className="admin__label">Description</span>
                      <textarea
                        rows={2}
                        defaultValue={role.desc}
                        key={`${role.id}-desc`}
                        onBlur={(e) => patchRole(role.id, { description: e.target.value })}
                      />
                    </label>
                    <label className="admin__field">
                      <span className="admin__label">Tags · comma separated</span>
                      <input
                        defaultValue={role.tags.join(", ")}
                        key={`${role.id}-tags`}
                        onBlur={(e) =>
                          patchRole(role.id, {
                            tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                          })
                        }
                      />
                    </label>
                    <ImageField
                      label="Proof image"
                      ratio="4 / 3"
                      value={role.img}
                      onFile={roleImage(role.id)}
                      onClear={() => patchRole(role.id, { imageUrl: null })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="admin__add" onClick={addRole}>
            + Add a role
          </button>
        </section>

        {/* ---------------- Works ---------------- */}
        <section className="admin__panel">
          <h2 className="admin__title">Works</h2>
          <p className="admin__note">
            Toggle “featured” to surface a project on the homepage (first
            four). Everything appears on the All Works page.
          </p>

          {!content.worksLoaded ? (
            <div className="admin__stack">
              {[0, 1, 2].map((i) => (
                <div className="admin__card" key={i}>
                  <div className="skel admin__skel-line" />
                  <div className="skel admin__skel-line admin__skel-line--short" />
                  <div className="skel admin__skel-box" />
                </div>
              ))}
            </div>
          ) : content.worksEmpty ? (
            <p className="admin__empty">No works yet — publish the first one below.</p>
          ) : (
            <div className="admin__stack">
              {content.works.map((work, i) => (
                <div className="admin__card" key={work.id}>
                  <div className="admin__card-head">
                    <span className="admin__badge">{String(i + 1).padStart(2, "0")}</span>
                    <span className="admin__card-title">{work.name || "Untitled work"}</span>
                    <span className="admin__spacer" />
                    <label className="admin__switch" title="Show on homepage">
                      <input
                        type="checkbox"
                        checked={work.featured}
                        onChange={(e) => patchWork(work.id, { featured: e.target.checked })}
                      />
                      <span className="admin__switch-track" aria-hidden="true">
                        <span className="admin__switch-thumb" />
                      </span>
                      <span className="admin__switch-label">Featured</span>
                    </label>
                    <button type="button" className="admin__icon" disabled={i === 0} aria-label="Move up" onClick={() => moveWork(i, -1)}>
                      <ArrowIcon up />
                    </button>
                    <button type="button" className="admin__icon" disabled={i === content.works.length - 1} aria-label="Move down" onClick={() => moveWork(i, 1)}>
                      <ArrowIcon />
                    </button>
                    <button type="button" className="admin__icon admin__icon--danger" aria-label="Delete work" onClick={() => delWork(work.id)}>
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="admin__fields">
                    <div className="admin__pair">
                      <label className="admin__field">
                        <span className="admin__label">Project name</span>
                        <input
                          defaultValue={work.name}
                          key={`${work.id}-name`}
                          onBlur={(e) => patchWork(work.id, { title: e.target.value })}
                        />
                      </label>
                      <label className="admin__field">
                        <span className="admin__label">Category</span>
                        <input
                          defaultValue={work.category}
                          key={`${work.id}-cat`}
                          onBlur={(e) => patchWork(work.id, { category: e.target.value })}
                        />
                      </label>
                    </div>
                    <label className="admin__field">
                      <span className="admin__label">Description</span>
                      <textarea
                        rows={2}
                        defaultValue={work.desc}
                        key={`${work.id}-desc`}
                        onBlur={(e) => patchWork(work.id, { description: e.target.value })}
                      />
                    </label>
                    <label className="admin__field">
                      <span className="admin__label">Live URL</span>
                      <input
                        defaultValue={work.url}
                        key={`${work.id}-url`}
                        placeholder="https://…"
                        onBlur={(e) => patchWork(work.id, { liveUrl: e.target.value })}
                      />
                    </label>
                    <ImageField
                      label="Screenshot"
                      ratio="16 / 10"
                      value={work.image}
                      onFile={workImage(work.id)}
                      onClear={() => patchWork(work.id, { imageUrl: null })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="admin__add" onClick={addWork}>
            + Add a work
          </button>
        </section>
      </main>

      {toast && (
        <div className={`admin__toast admin__toast--${toast.kind}`}>{toast.msg}</div>
      )}
    </div>
  );
}

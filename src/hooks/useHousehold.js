import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useLocalStorage } from "./useLocalStorage";

export const SYNC_KEYS = ["plan", "routine", "checked", "extras", "recipes", "favorites", "hidden"];
const POLL_MS = 5000;
const WRITE_DEBOUNCE_MS = 500;

function readCache(key, fallback) {
  try {
    const raw = window.localStorage.getItem(`meals.${key}.v1`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * The household's shared state. Always cached in localStorage so the app
 * works alone. Once signed in with Google and in a household, the same keys
 * live in one document on the server that every member's phone reads and
 * writes:
 *
 *  - local edits are sent as a PATCH of just the changed keys, debounced
 *  - the server is polled while the tab is visible; remote changes are applied
 *    to any key that has no unsent local edit
 *
 * `code` is the household this phone belongs to, cached so a phone that was
 * signed out (or set up before sign-in existed) rejoins it on its next sign-in.
 *
 * status: "local" (no household), "signed-out" (household but no session),
 * "connecting", "synced", "offline", "error", "missing" (household not found).
 */
export function useHousehold(defaults) {
  const [code, setCode] = useLocalStorage("meals.household.v1", null);
  const [user, setUser] = useLocalStorage("meals.account.v1", null);
  const [googleClientId, setGoogleClientId] = useState(null);
  const [data, setData] = useState(() => Object.fromEntries(SYNC_KEYS.map((k) => [k, readCache(k, defaults[k])])));
  const [status, setStatus] = useState(!code ? "local" : user ? "connecting" : "signed-out");
  const signedIn = Boolean(user);

  const dirty = useRef(new Set());
  const version = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const codeRef = useRef(code);
  codeRef.current = code;

  // Cache every key locally.
  useEffect(() => {
    for (const k of SYNC_KEYS) {
      try {
        window.localStorage.setItem(`meals.${k}.v1`, JSON.stringify(data[k]));
      } catch {
        // Storage full or blocked; in-memory state still works.
      }
    }
  }, [data]);

  const applyRemote = useCallback((remote) => {
    setData((prev) => {
      const next = { ...prev };
      for (const k of SYNC_KEYS) {
        if (remote[k] !== undefined && remote[k] !== null && !dirty.current.has(k)) next[k] = remote[k];
      }
      return next;
    });
  }, []);

  /** Note the server's reply to an auth-protected call: 401 means the session is gone. */
  const checkAuth = useCallback(
    (err) => {
      if (err.status === 401) setUser(null);
      return err;
    },
    [setUser],
  );

  // Ask the server who is signed in. It is the source of truth for the
  // household once signed in; offline, the cached account is kept.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        setGoogleClientId(me.googleClientId);
        setUser(me.user);
        if (me.user && me.household !== codeRef.current) {
          dirty.current.clear();
          setCode(me.household);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setCode, setUser]);

  // Poll the household document while signed in, in a household, and the tab is visible.
  useEffect(() => {
    version.current = null;
    if (!code) {
      setStatus("local");
      return undefined;
    }
    if (!signedIn) {
      setStatus("signed-out");
      return undefined;
    }
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === "hidden") {
        timer = setTimeout(tick, POLL_MS);
        return;
      }
      try {
        const res = await api.read(version.current);
        if (cancelled) return;
        if (res.changed) {
          version.current = res.version;
          applyRemote(res.data);
        }
        setStatus("synced");
      } catch (err) {
        if (cancelled) return;
        checkAuth(err);
        if (err.status === 401) return; // signed out; polling resumes after sign-in
        if (err.status === 404) {
          setStatus("missing");
          return; // stop polling; the household is gone
        }
        setStatus(err.status === 0 ? "offline" : "error");
      }
      timer = setTimeout(tick, POLL_MS);
    };

    setStatus("connecting");
    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [code, signedIn, applyRemote, checkAuth]);

  // Push local changes, debounced so a flurry of checkbox taps is one request.
  useEffect(() => {
    if (!code || !signedIn || dirty.current.size === 0) return undefined;
    const t = setTimeout(async () => {
      const keys = Array.from(dirty.current);
      const patch = {};
      for (const k of keys) patch[k] = dataRef.current[k];
      try {
        await api.update(patch);
        // Only clear keys that weren't edited again while the request was out.
        for (const k of keys) if (dataRef.current[k] === patch[k]) dirty.current.delete(k);
        // Don't adopt the version the PATCH returns: another phone may have
        // written since our last poll, and skipping ahead would hide its edits.
        // The next poll sees a newer version and fetches the whole document.
        setStatus("synced");
      } catch (err) {
        // Keep the keys dirty; they go out on the next change or reconnect.
        checkAuth(err);
        if (err.status !== 401) setStatus(err.status === 0 ? "offline" : err.status === 404 ? "missing" : "error");
      }
    }, WRITE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [data, code, signedIn, checkAuth]);

  const update = useCallback((key, next) => {
    dirty.current.add(key);
    setData((prev) => ({ ...prev, [key]: typeof next === "function" ? next(prev[key]) : next }));
  }, []);

  /**
   * Sign in with the credential from Google's button. A phone that already
   * had a household rejoins it; one whose account is already in a household
   * takes that household's data. Returns the household code, or null.
   */
  const signIn = useCallback(
    async (credential) => {
      const me = await api.signIn(credential);
      let target = me.household;
      if (!target && codeRef.current) {
        try {
          await api.join(codeRef.current);
          target = codeRef.current;
        } catch (err) {
          if (err.status !== 404) throw err;
        }
      }
      // Unsent edits only carry over when rejoining the same household.
      if (target !== codeRef.current) dirty.current.clear();
      setCode(target || null);
      setUser(me.user);
      return target || null;
    },
    [setCode, setUser],
  );

  /** Sign out. This phone keeps its data and works on its own. */
  const signOut = useCallback(async () => {
    await api.signOut().catch(() => {});
    setUser(null);
    setCode(null);
  }, [setCode, setUser]);

  /** Create a household on the server seeded with this phone's data. */
  const create = useCallback(async () => {
    const res = await api.create(dataRef.current).catch((err) => Promise.reject(checkAuth(err)));
    dirty.current.clear();
    setCode(res.code);
    return res.code;
  }, [checkAuth, setCode]);

  /**
   * Join an existing household; its data replaces this phone's. Signed out,
   * the code is remembered and the phone joins on sign-in ("signed-out").
   */
  const join = useCallback(
    async (newCode) => {
      try {
        await api.join(newCode);
      } catch (err) {
        if (checkAuth(err).status !== 401) throw err;
        setCode(newCode);
        return "signed-out";
      }
      const res = await api.read();
      dirty.current.clear();
      applyRemote(res.data);
      setCode(newCode);
      return "joined";
    },
    [applyRemote, checkAuth, setCode],
  );

  /** Leave the household. Other members keep it; this phone keeps its data. */
  const leave = useCallback(async () => {
    if (signedIn) await api.leave().catch((err) => Promise.reject(checkAuth(err)));
    setCode(null);
  }, [checkAuth, setCode, signedIn]);

  return { data, update, code, status, user, googleClientId, signIn, signOut, create, join, leave };
}

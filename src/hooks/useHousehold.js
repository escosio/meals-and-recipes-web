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
 * works alone. With a household code set, the same keys live in one document
 * on the server that every phone with the code reads and writes:
 *
 *  - local edits are sent as a PATCH of just the changed keys, debounced
 *  - the server is polled while the tab is visible; remote changes are applied
 *    to any key that has no unsent local edit
 *
 * status: "local" (no code), "connecting", "synced", "offline", "error", "missing" (code not found).
 */
export function useHousehold(defaults) {
  const [code, setCode] = useLocalStorage("meals.household.v1", null);
  const [data, setData] = useState(() => Object.fromEntries(SYNC_KEYS.map((k) => [k, readCache(k, defaults[k])])));
  const [status, setStatus] = useState(code ? "connecting" : "local");

  const dirty = useRef(new Set());
  const version = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

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

  // Poll the household document while a code is set and the tab is visible.
  useEffect(() => {
    if (!code) {
      version.current = null;
      setStatus("local");
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
        const res = await api.read(code, version.current);
        if (cancelled) return;
        if (res.changed) {
          version.current = res.version;
          applyRemote(res.data);
        }
        setStatus("synced");
      } catch (err) {
        if (cancelled) return;
        if (err.status === 404) {
          setStatus("missing");
          return; // stop polling; the code is gone
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
  }, [code, applyRemote]);

  // Push local changes, debounced so a flurry of checkbox taps is one request.
  useEffect(() => {
    if (!code || dirty.current.size === 0) return undefined;
    const t = setTimeout(async () => {
      const keys = Array.from(dirty.current);
      const patch = {};
      for (const k of keys) patch[k] = dataRef.current[k];
      try {
        const res = await api.update(code, patch);
        for (const k of keys) dirty.current.delete(k);
        version.current = res.version;
        setStatus("synced");
      } catch (err) {
        // Keep the keys dirty; they go out on the next change or reconnect.
        setStatus(err.status === 0 ? "offline" : err.status === 404 ? "missing" : "error");
      }
    }, WRITE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [data, code]);

  const update = useCallback((key, next) => {
    dirty.current.add(key);
    setData((prev) => ({ ...prev, [key]: typeof next === "function" ? next(prev[key]) : next }));
  }, []);

  /** Create a household on the server seeded with this phone's data. */
  const create = useCallback(async () => {
    const res = await api.create(dataRef.current);
    version.current = res.version;
    dirty.current.clear();
    setCode(res.code);
    return res.code;
  }, [setCode]);

  /** Join an existing household; its data replaces this phone's. */
  const join = useCallback(
    async (newCode) => {
      const res = await api.read(newCode);
      dirty.current.clear();
      version.current = res.version;
      applyRemote(res.data);
      setCode(newCode);
    },
    [applyRemote, setCode],
  );

  const leave = useCallback(() => setCode(null), [setCode]);

  return { data, update, code, status, create, join, leave };
}

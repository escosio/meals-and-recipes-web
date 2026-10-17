import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, authReady, syncAvailable } from "../lib/firebase";
import { useLocalStorage } from "./useLocalStorage";

const KEYS = ["plan", "routine", "checked", "extras"];

function readCache(key, fallback) {
  try {
    const raw = window.localStorage.getItem(`meals.${key}.v1`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * The household's shared state: plan, routine, shopping check-offs and extras.
 *
 * Always cached in localStorage so the app works alone. When a household code
 * is set and Firebase is configured, the same four keys live in one Firestore
 * document that every device with the code reads and writes. Last write wins
 * per key; remote changes never clobber a local change that hasn't been sent.
 *
 * status: "unavailable" (no Firebase config), "local" (no code), "connecting",
 *         "synced", "offline" (serving cached data), "error".
 */
export function useHousehold(defaults) {
  const [code, setCode] = useLocalStorage("meals.household.v1", null);
  const [data, setData] = useState(() =>
    Object.fromEntries(KEYS.map((k) => [k, readCache(k, defaults[k])])),
  );
  const [status, setStatus] = useState(syncAvailable ? (code ? "connecting" : "local") : "unavailable");

  const dirty = useRef(new Set());
  const dataRef = useRef(data);
  dataRef.current = data;

  // Cache every key locally.
  useEffect(() => {
    for (const k of KEYS) {
      try {
        window.localStorage.setItem(`meals.${k}.v1`, JSON.stringify(data[k]));
      } catch {
        // Storage full or blocked; in-memory state still works.
      }
    }
  }, [data]);

  // Subscribe to the household document.
  useEffect(() => {
    if (!db || !code) {
      setStatus(syncAvailable ? "local" : "unavailable");
      return undefined;
    }
    setStatus("connecting");
    let unsub = () => {};
    let cancelled = false;
    authReady.then((ok) => {
      if (cancelled) return;
      if (!ok) {
        setStatus("error");
        return;
      }
      const ref = doc(db, "households", code);
      let first = true;
      unsub = onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => {
          if (!snap.exists()) {
            // New household: seed it with whatever this device has.
            if (first) {
              setDoc(ref, { ...dataRef.current, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(
                () => setStatus("error"),
              );
            }
            first = false;
            return;
          }
          first = false;
          const remote = snap.data();
          setData((prev) => {
            const next = { ...prev };
            for (const k of KEYS) {
              if (remote[k] !== undefined && !dirty.current.has(k)) next[k] = remote[k];
            }
            return next;
          });
          setStatus(snap.metadata.fromCache && !snap.metadata.hasPendingWrites ? "offline" : "synced");
        },
        () => setStatus("error"),
      );
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [code]);

  // Push local changes, lightly debounced so a flurry of checkbox taps is one write.
  useEffect(() => {
    if (!db || !code || dirty.current.size === 0) return undefined;
    const t = setTimeout(async () => {
      const keys = Array.from(dirty.current);
      dirty.current.clear();
      const patch = { updatedAt: serverTimestamp() };
      for (const k of keys) patch[k] = dataRef.current[k];
      const ref = doc(db, "households", code);
      try {
        // updateDoc replaces each top-level key outright, so deleted days go away too.
        await updateDoc(ref, patch);
      } catch {
        try {
          await setDoc(ref, { ...dataRef.current, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        } catch {
          for (const k of keys) dirty.current.add(k);
          setStatus("error");
        }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [data, code]);

  const update = useCallback((key, next) => {
    dirty.current.add(key);
    setData((prev) => ({ ...prev, [key]: typeof next === "function" ? next(prev[key]) : next }));
  }, []);

  const join = useCallback((newCode) => setCode(newCode), [setCode]);
  const leave = useCallback(() => setCode(null), [setCode]);

  return { data, update, code, status, join, leave };
}

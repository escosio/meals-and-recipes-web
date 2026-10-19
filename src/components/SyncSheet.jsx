import { useState } from "react";
import Sheet from "./Sheet";
import { normaliseCode } from "../lib/api";

export function statusLabel(status) {
  switch (status) {
    case "synced":
      return "Synced";
    case "offline":
      return "Offline, will sync when back online";
    case "connecting":
      return "Connecting";
    case "error":
      return "Can't reach the server";
    case "missing":
      return "This household no longer exists";
    default:
      return "Only on this phone";
  }
}

export default function SyncSheet({ open, onClose, code, status, onCreate, onJoin, onLeave, onToast }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      onToast("Code copied");
    } catch {
      onToast("Couldn't copy. Read it out instead.");
    }
  };

  const run = async (fn, okMessage) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onToast(okMessage);
      setInput("");
    } catch (err) {
      setError(err.status === 404 ? "No household with that code. Check it and try again." : err.status === 0 ? "You're offline. Try again when connected." : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const c = normaliseCode(input);
    if (c.length !== 6) return;
    run(() => onJoin(c), "Joined. Your plans are now shared.");
  };

  if (code) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="Shared household"
        subtitle={statusLabel(status)}
        footer={
          <>
            <button
              className="btn danger"
              onClick={() => {
                onLeave();
                onToast("Left the household. This phone is on its own now.");
              }}
            >
              Leave household
            </button>
            <span className="spacer" />
            <button className="btn primary" onClick={copy}>
              Copy code
            </button>
          </>
        }
      >
        <div className="code-display" aria-label="Household code">
          {code}
        </div>
        <p className="help">
          Anyone with this code sees and edits the same weeks, routine, recipes and shopping list. Text it to your wife
          and have her enter it under Sync on her phone.
        </p>
        {status === "missing" && <p className="notice">This code isn't on the server any more. Leave and create a new one.</p>}
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Plan together" subtitle="One shared plan across your phones">
      <div className="sync-options">
        <div className="sync-option">
          <h3>Start a household</h3>
          <p className="help">Creates a code and uploads what's on this phone. Share the code with your wife.</p>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => run(async () => onToast(`Household ${await onCreate()} created`), "Sharing is on")}
          >
            Create a code
          </button>
        </div>
        <div className="sync-option">
          <h3>Join with a code</h3>
          <p className="help">Replaces what's on this phone with the shared plan.</p>
          <form className="add-item" onSubmit={submit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="6-character code"
              aria-label="Household code"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={8}
            />
            <button className="btn" type="submit" disabled={busy || normaliseCode(input).length !== 6}>
              Join
            </button>
          </form>
        </div>
        {error && <p className="notice">{error}</p>}
      </div>
    </Sheet>
  );
}

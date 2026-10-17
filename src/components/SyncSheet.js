import { useState } from "react";
import Sheet from "./Sheet";
import { makeHouseholdCode, normaliseCode } from "../lib/firebase";

export default function SyncSheet({ open, onClose, code, status, onJoin, onLeave, onToast }) {
  const [input, setInput] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      onToast("Code copied");
    } catch {
      onToast("Couldn't copy. Read it out instead.");
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const c = normaliseCode(input);
    if (c.length < 6) return;
    onJoin(c);
    setInput("");
    onToast("Joined. Your plans are now shared.");
  };

  if (status === "unavailable") {
    return (
      <Sheet open={open} onClose={onClose} title="Sync" subtitle="Not set up on this deployment">
        <p className="notice">
          Sharing needs a Firebase project. Add the REACT_APP_FIREBASE_* variables from the README to the environment and
          redeploy, and this screen will let you create a household code.
        </p>
      </Sheet>
    );
  }

  if (code) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="Shared household"
        subtitle={statusLabel(status)}
        footer={
          <>
            <button className="btn danger" onClick={() => { onLeave(); onToast("Left the household. This device is on its own now."); }}>
              Leave household
            </button>
            <span className="spacer" />
            <button className="btn primary" onClick={copy}>
              Copy code
            </button>
          </>
        }
      >
        <div className="code-display" aria-label="Household code">{code}</div>
        <p className="help">
          Anyone with this code sees and edits the same week, routine and shopping list. Text it to your wife and have
          her enter it under Sync on her phone.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Plan together" subtitle="One shared plan across your phones">
      <div className="sync-options">
        <div className="sync-option">
          <h3>Start a household</h3>
          <p className="help">Creates a code and uploads the plan on this device. Share the code with your wife.</p>
          <button
            className="btn primary"
            onClick={() => {
              const c = makeHouseholdCode();
              onJoin(c);
              onToast(`Household ${c} created`);
            }}
          >
            Create a code
          </button>
        </div>
        <div className="sync-option">
          <h3>Join with a code</h3>
          <p className="help">Replaces the plan on this device with the shared one.</p>
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
            <button className="btn" type="submit" disabled={normaliseCode(input).length < 6}>
              Join
            </button>
          </form>
        </div>
      </div>
    </Sheet>
  );
}

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
    case "local":
      return "Only on this device";
    default:
      return "Sync not set up";
  }
}

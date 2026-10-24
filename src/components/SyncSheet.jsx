import { useState } from "react";
import Sheet from "./Sheet";
import GoogleButton from "./GoogleButton";
import { normaliseCode, joinLink } from "../lib/api";

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
    case "signed-out":
      return "Signed out. Sign in to sync.";
    default:
      return "Only on this phone";
  }
}

function errorMessage(err) {
  switch (err.status) {
    case 404:
      return "No household with that code. Check it and try again.";
    case 401:
      return "Your sign-in has ended. Sign in again.";
    case 503:
      return "Can't sign in right now. Try again in a minute.";
    case 0:
      return "You're offline. Try again when connected.";
    default:
      return "Something went wrong. Try again.";
  }
}

export default function SyncSheet({
  open,
  onClose,
  code,
  status,
  user,
  googleClientId,
  onSignIn,
  onSignOut,
  onCreate,
  onJoin,
  onLeave,
  onToast,
}) {
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

  // Phones get the system share sheet (Messages, WhatsApp...); desktops copy the link.
  const share = async () => {
    const link = joinLink(code);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meals & Recipes", text: `Join our meal plan: ${link}` });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      onToast("Link copied. Send it to your wife.");
    } catch {
      onToast(`Couldn't copy. The link is ${link}`);
    }
  };

  // okMessage is a string, or a function of fn's result.
  const run = async (fn, okMessage) => {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      onToast(typeof okMessage === "function" ? okMessage(result) : okMessage);
      setInput("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const signIn = (credential) =>
    run(
      () => onSignIn(credential),
      (household) => (household ? "Signed in. Your plans are shared." : "Signed in"),
    );

  const account = user && (
    <p className="help account-line">
      Signed in as {user.email}.{" "}
      <button
        className="btn quiet"
        onClick={async () => {
          await onSignOut();
          onToast("Signed out. This phone keeps its plans.");
        }}
      >
        Sign out
      </button>
    </p>
  );

  const leaveButton = (
    <button
      className="btn danger"
      disabled={busy}
      onClick={() => run(onLeave, "Left the household. This phone is on its own now.")}
    >
      Leave household
    </button>
  );

  if (!user) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="Plan together"
        subtitle={code ? statusLabel(status) : "One shared plan across your phones"}
        footer={code ? leaveButton : undefined}
      >
        {code ? (
          <p className="help">
            This phone is in household {code}. Sign in with Google to keep it in step with the others.
          </p>
        ) : (
          <p className="help">
            Sign in with Google, then start a household or join one with a code. Only people who sign in and join can
            see your plans.
          </p>
        )}
        <GoogleButton clientId={googleClientId} onCredential={signIn} />
        {error && <p className="notice">{error}</p>}
      </Sheet>
    );
  }

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
            {leaveButton}
            <span className="spacer" />
            <button className="btn" onClick={copy}>
              Copy code
            </button>
            <button className="btn primary" onClick={share}>
              Share link
            </button>
          </>
        }
      >
        <div className="code-display" aria-label="Household code">
          {code}
        </div>
        <p className="help">
          Everyone in the household sees and edits the same weeks, routine, recipes and shopping list. Send your wife
          the link, or read her the code. She signs in with Google and joins.
        </p>
        <p className="help link-preview">{joinLink(code)}</p>
        {account}
        {status === "missing" && <p className="notice">This code isn't on the server any more. Leave and create a new one.</p>}
        {error && <p className="notice">{error}</p>}
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
        {account}
      </div>
    </Sheet>
  );
}

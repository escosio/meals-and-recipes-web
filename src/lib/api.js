// Thin client for the sync API (api/index.py). Same-origin, so it works on
// Vercel and through the dev proxy without any configuration, and the browser
// sends the session cookie with every request.

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "offline");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.detail || res.statusText);
  return json;
}

export const api = {
  me: () => request("GET", "/api/me"),
  signIn: (credential) => request("POST", "/api/auth/google", { credential }),
  signOut: () => request("POST", "/api/auth/logout"),
  create: (seed) => request("POST", "/api/household", seed),
  join: (code) => request("POST", "/api/household/join", { code }),
  leave: () => request("POST", "/api/household/leave"),
  read: (since) => request("GET", `/api/household${since ? `?since=${encodeURIComponent(since)}` : ""}`),
  update: (patch) => request("PATCH", "/api/household", patch),
};

export { ApiError };

export function normaliseCode(input) {
  return (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** A link that joins the household when opened. */
export function joinLink(code) {
  return `${window.location.origin}/?join=${code}`;
}

/** The household code in the current URL's ?join= parameter, or null. */
export function joinCodeFromUrl() {
  const code = normaliseCode(new URLSearchParams(window.location.search).get("join"));
  return code.length === 6 ? code : null;
}

/** Drop the ?join= parameter so a reload doesn't join again. */
export function clearJoinParam() {
  if (!window.location.search) return;
  window.history.replaceState({}, "", window.location.pathname);
}

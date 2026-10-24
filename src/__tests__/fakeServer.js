// A tiny in-memory stand-in for api/index.py used by the sync tests: one
// phone's session (signed in or not), at most one household per user, and a
// version that bumps on every write. Households created here get code ABC234.
export function fakeServer(initialDoc = {}, { signedIn = true, household = null } = {}) {
  const docs = {};
  let n = 0;
  const calls = [];
  const state = { signedIn, household, user: { email: "scott@example.com", name: "Scott" } };
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const me = () => ({
    googleClientId: "test-client",
    user: state.signedIn ? state.user : null,
    household: state.signedIn ? state.household : null,
  });

  const fetch = async (url, { method = "GET", body } = {}) => {
    const parsed = body ? JSON.parse(body) : undefined;
    calls.push({ method, url, body: parsed });
    const path = url.split("?")[0];

    if (path === "/api/me") return json(200, me());
    if (path === "/api/auth/google") {
      state.signedIn = true;
      state.user = { email: `${parsed.credential}@example.com`, name: parsed.credential };
      return json(200, me());
    }
    if (path === "/api/auth/logout") {
      state.signedIn = false;
      return json(200, { ok: true });
    }
    if (!state.signedIn) return json(401, { detail: "Sign in to sync" });

    if (path === "/api/household" && method === "POST") {
      docs.ABC234 = { data: { ...initialDoc, ...parsed }, version: `v${++n}` };
      state.household = "ABC234";
      return json(201, { code: "ABC234", version: docs.ABC234.version });
    }
    if (path === "/api/household/join") {
      const code = parsed.code.toUpperCase();
      if (!docs[code]) return json(404, { detail: "No household with that code" });
      state.household = code;
      return json(200, { code });
    }
    if (path === "/api/household/leave") {
      state.household = null;
      return json(200, { ok: true });
    }

    const doc = docs[state.household];
    if (!doc) return json(404, { detail: "You're not in a household" });
    if (method === "PATCH") {
      Object.assign(doc.data, parsed);
      doc.version = `v${++n}`;
      return json(200, { version: doc.version });
    }
    const since = new URLSearchParams(url.split("?")[1] || "").get("since");
    if (since === doc.version) return json(200, { changed: false, version: doc.version });
    return json(200, { changed: true, version: doc.version, code: state.household, data: doc.data });
  };

  return {
    fetch,
    calls,
    docs,
    state,
    seed: (data) => (docs.ABC234 = { data, version: `v${++n}` }),
    /** Calls other than the sign-in check every page load makes. */
    syncCalls: () => calls.filter((c) => c.url !== "/api/me"),
  };
}

/**
 * Stand in for Google's sign-in script: renderButton draws a plain button
 * that signs in as `name`.
 */
export function fakeGoogle(name = "scott") {
  let callback = null;
  window.google = {
    accounts: {
      id: {
        initialize: ({ callback: cb }) => {
          callback = cb;
        },
        renderButton: (el) => {
          const button = document.createElement("button");
          button.textContent = "Sign in with Google";
          button.addEventListener("click", () => callback({ credential: name }));
          el.replaceChildren(button);
        },
      },
    },
  };
}

import { vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useHousehold } from "../hooks/useHousehold";

const DEFAULTS = { plan: {}, routine: {}, checked: {}, extras: {}, recipes: [], favorites: [] };

// A tiny fake of api/index.py: one household, version bumps on every write.
function fakeServer(initialDoc = {}) {
  const docs = {};
  let n = 0;
  const calls = [];
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const fetch = async (url, { method = "GET", body } = {}) => {
    calls.push({ method, url, body: body ? JSON.parse(body) : undefined });
    const m = url.match(/\/api\/households(?:\/([A-Z0-9]+))?(?:\?since=(.*))?$/);
    const code = m?.[1];
    if (method === "POST") {
      docs.ABC234 = { data: { ...initialDoc, ...JSON.parse(body) }, version: `v${++n}` };
      return json(201, { code: "ABC234", version: docs.ABC234.version });
    }
    const doc = docs[code];
    if (!doc) return json(404, { detail: "No household with that code" });
    if (method === "PATCH") {
      Object.assign(doc.data, JSON.parse(body));
      doc.version = `v${++n}`;
      return json(200, { version: doc.version });
    }
    const since = m?.[2] && decodeURIComponent(m[2]);
    if (since === doc.version) return json(200, { changed: false, version: doc.version });
    return json(200, { changed: true, version: doc.version, data: doc.data });
  };
  return { fetch, calls, docs, seed: (data) => (docs.ABC234 = { data, version: `v${++n}` }) };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("without a code the plan stays on this device and nothing is fetched", () => {
  const server = fakeServer();
  vi.spyOn(window, "fetch").mockImplementation(server.fetch);
  const { result } = renderHook(() => useHousehold(DEFAULTS));
  expect(result.current.status).toBe("local");
  act(() => result.current.update("favorites", ["tacos"]));
  expect(result.current.data.favorites).toEqual(["tacos"]);
  expect(JSON.parse(window.localStorage.getItem("meals.favorites.v1"))).toEqual(["tacos"]);
  expect(server.calls).toHaveLength(0);
});

test("creating a household uploads this device's data and starts syncing", async () => {
  const server = fakeServer();
  vi.spyOn(window, "fetch").mockImplementation(server.fetch);
  const { result } = renderHook(() => useHousehold(DEFAULTS));
  act(() => result.current.update("plan", { "2026-10-20": { Dinner: ["tacos"] } }));

  let code;
  await act(async () => {
    code = await result.current.create();
  });
  expect(code).toBe("ABC234");
  expect(server.calls[0].method).toBe("POST");
  expect(server.calls[0].body.plan).toEqual({ "2026-10-20": { Dinner: ["tacos"] } });
  await waitFor(() => expect(result.current.status).toBe("synced"));
  expect(JSON.parse(window.localStorage.getItem("meals.household.v1"))).toBe("ABC234");
});

test("joining replaces local data with the shared document, and local edits are patched up", async () => {
  const server = fakeServer();
  server.seed({ plan: { "2026-10-20": { Dinner: ["meatballs"] } }, favorites: ["meatballs"] });
  vi.spyOn(window, "fetch").mockImplementation(server.fetch);
  const { result } = renderHook(() => useHousehold(DEFAULTS));
  act(() => result.current.update("favorites", ["tacos"]));

  await act(async () => {
    await result.current.join("ABC234");
  });
  expect(result.current.code).toBe("ABC234");
  expect(result.current.data.plan).toEqual({ "2026-10-20": { Dinner: ["meatballs"] } });
  expect(result.current.data.favorites).toEqual(["meatballs"]);

  act(() => result.current.update("checked", { "2026-10-19": { "meatballs:0": true } }));
  await waitFor(() => expect(server.calls.some((c) => c.method === "PATCH")).toBe(true), { timeout: 2000 });
  const patch = server.calls.find((c) => c.method === "PATCH").body;
  expect(Object.keys(patch)).toEqual(["checked"]);
  expect(server.docs.ABC234.data.checked).toEqual({ "2026-10-19": { "meatballs:0": true } });
});

test("a missing code on the server is reported and leaving goes back to local", async () => {
  const server = fakeServer();
  vi.spyOn(window, "fetch").mockImplementation(server.fetch);
  window.localStorage.setItem("meals.household.v1", JSON.stringify("ZZZZZZ"));
  const { result } = renderHook(() => useHousehold(DEFAULTS));
  await waitFor(() => expect(result.current.status).toBe("missing"));
  act(() => result.current.leave());
  expect(result.current.status).toBe("local");
  expect(result.current.code).toBeNull();
});

import { vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useHousehold } from "../hooks/useHousehold";
import { fakeServer } from "./fakeServer";

const DEFAULTS = { plan: {}, routine: {}, checked: {}, extras: {}, recipes: [], favorites: [] };

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Render the hook against `server` and wait until it knows who is signed in. */
async function setup(server) {
  vi.spyOn(window, "fetch").mockImplementation(server.fetch);
  const hook = renderHook(() => useHousehold(DEFAULTS));
  await waitFor(() => expect(hook.result.current.googleClientId).toBe("test-client"));
  return hook.result;
}

test("without a household the plan stays on this device and nothing is synced", async () => {
  const server = fakeServer({}, { signedIn: false });
  const result = await setup(server);
  expect(result.current.status).toBe("local");
  expect(result.current.user).toBeNull();
  act(() => result.current.update("favorites", ["tacos"]));
  expect(result.current.data.favorites).toEqual(["tacos"]);
  expect(JSON.parse(window.localStorage.getItem("meals.favorites.v1"))).toEqual(["tacos"]);
  await new Promise((r) => setTimeout(r, 700));
  expect(server.syncCalls()).toHaveLength(0);
});

test("creating a household uploads this device's data and starts syncing", async () => {
  const server = fakeServer();
  const result = await setup(server);
  expect(result.current.user.email).toBe("scott@example.com");
  act(() => result.current.update("plan", { "2026-10-20": { Dinner: ["tacos"] } }));

  let code;
  await act(async () => {
    code = await result.current.create();
  });
  expect(code).toBe("ABC234");
  const post = server.calls.find((c) => c.method === "POST");
  expect(post.url).toBe("/api/household");
  expect(post.body.plan).toEqual({ "2026-10-20": { Dinner: ["tacos"] } });
  await waitFor(() => expect(result.current.status).toBe("synced"));
  expect(JSON.parse(window.localStorage.getItem("meals.household.v1"))).toBe("ABC234");
});

test("joining replaces local data with the shared document, and local edits are patched up", async () => {
  const server = fakeServer();
  server.seed({ plan: { "2026-10-20": { Dinner: ["meatballs"] } }, favorites: ["meatballs"] });
  const result = await setup(server);
  act(() => result.current.update("favorites", ["tacos"]));

  await act(async () => {
    expect(await result.current.join("ABC234")).toBe("joined");
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

test("an edit from another phone just before a local write still arrives", async () => {
  const server = fakeServer();
  server.seed({ plan: {}, favorites: ["meatballs"] });
  const result = await setup(server);
  await act(async () => {
    await result.current.join("ABC234");
  });
  await waitFor(() => expect(result.current.status).toBe("synced"));

  // The other phone stars a recipe, then this phone plans a dinner before its next poll.
  server.docs.ABC234.data.favorites = ["meatballs", "pernil"];
  server.docs.ABC234.version = "other-phone";
  act(() => result.current.update("plan", { "2026-10-20": { Dinner: ["tacos"] } }));
  await waitFor(() => expect(server.calls.some((c) => c.method === "PATCH")).toBe(true), { timeout: 2000 });
  await waitFor(() => expect(result.current.status).toBe("synced"));

  // Next poll: the other phone's favorite shows up and our plan is kept.
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await waitFor(() => expect(result.current.data.favorites).toEqual(["meatballs", "pernil"]));
  expect(result.current.data.plan).toEqual({ "2026-10-20": { Dinner: ["tacos"] } });
});

test("a phone set up with a code before sign-in rejoins its household when it signs in", async () => {
  const server = fakeServer({}, { signedIn: false });
  server.seed({ plan: {}, favorites: ["meatballs"] });
  window.localStorage.setItem("meals.household.v1", JSON.stringify("ABC234"));
  const result = await setup(server);
  expect(result.current.status).toBe("signed-out");
  expect(server.syncCalls()).toHaveLength(0);

  // An edit made while signed out is kept and goes up after signing in.
  act(() => result.current.update("favorites", ["meatballs", "tacos"]));
  await act(async () => {
    expect(await result.current.signIn("scott")).toBe("ABC234");
  });
  expect(server.state.household).toBe("ABC234");
  await waitFor(() => expect(server.docs.ABC234.data.favorites).toEqual(["meatballs", "tacos"]), { timeout: 2000 });
  await waitFor(() => expect(result.current.status).toBe("synced"));
});

test("signing in on a new phone takes the account's household", async () => {
  const server = fakeServer({}, { signedIn: false, household: "ABC234" });
  server.seed({ plan: { "2026-10-20": { Dinner: ["pernil"] } } });
  const result = await setup(server);
  act(() => result.current.update("plan", { "2026-10-21": { Dinner: ["tacos"] } }));

  await act(async () => {
    await result.current.signIn("scott");
  });
  await waitFor(() => expect(result.current.data.plan).toEqual({ "2026-10-20": { Dinner: ["pernil"] } }));
  expect(server.calls.some((c) => c.method === "PATCH")).toBe(false);
});

test("when the session ends the phone shows signed out and stops syncing", async () => {
  const server = fakeServer();
  server.seed({ favorites: [] });
  const result = await setup(server);
  await act(async () => {
    await result.current.join("ABC234");
  });
  await waitFor(() => expect(result.current.status).toBe("synced"));

  server.state.signedIn = false;
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await waitFor(() => expect(result.current.status).toBe("signed-out"));
  expect(result.current.user).toBeNull();
  expect(result.current.code).toBe("ABC234");
});

test("signing out keeps this phone's plans and works on its own", async () => {
  const server = fakeServer();
  server.seed({ favorites: ["meatballs"] });
  const result = await setup(server);
  await act(async () => {
    await result.current.join("ABC234");
  });
  await act(async () => {
    await result.current.signOut();
  });
  expect(result.current.status).toBe("local");
  expect(result.current.code).toBeNull();
  expect(result.current.data.favorites).toEqual(["meatballs"]);
});

test("a missing household is reported and leaving goes back to local", async () => {
  const server = fakeServer({}, { household: "ZZZZZZ" });
  window.localStorage.setItem("meals.household.v1", JSON.stringify("ZZZZZZ"));
  const result = await setup(server);
  await waitFor(() => expect(result.current.status).toBe("missing"));
  await act(async () => {
    await result.current.leave();
  });
  expect(result.current.status).toBe("local");
  expect(result.current.code).toBeNull();
});

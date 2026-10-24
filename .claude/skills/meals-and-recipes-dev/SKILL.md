---
name: "meals-and-recipes-dev"
description: "Use when developing, fixing, reviewing or extending the meals-and-recipes-web project (weekly meal planner with React front end and Python sync API)."
---

# Meals & Recipes: development guide

This is a family weekly meal planner. It started as a Bootstrap recipe list (2023 to early 2026) and was redesigned in October 2026. This skill records the decisions from that redesign so later changes stay consistent with them. Before you change anything, read the relevant section. If a change goes against a decision listed here, say so and explain why before you make it.

## Shape of the app

- **Front end**: Create React App (`react-scripts` 5) for dev and build. The source is `.jsx`/`.js`. Recipe data lives in `src/recipes.ts`, the only TypeScript file.
- **Three views**, in tabs: **Plan** (Monday to Sunday), **Recipes** (the book) and **Shop** (the shopping list for the week). The app opens on Recipes.
- **Sync API**: FastAPI in `api/index.py` and `api/store.py`. It runs as a Vercel Python function (`vercel.json` rewrites `/api/*` to `/api/index`) and under uvicorn on :8000 locally. The CRA `proxy` sends `/api` to it.
- **Storage**: one row per household in Postgres (Neon, pooled connection string in `DATABASE_URL`). Tests and local work can set `MEALS_STORE=memory` instead.
- **Deploy**: Vercel at meals-and-recipes-web.vercel.app.

## Key decisions and why

### Product
- **Dinner is the main meal you plan.** Each day has one dinner, and lunch and breakfast are optional extras. They appear as a small line under the dinner card. The constants are `PRIMARY_MEAL` and `EXTRA_MEALS`/`PLAN_MEALS` in `lib/recipes.js`. Don't make all meals equal.
- **A slot holds a list of ids**, not a single id. The first id is the main dish (highlighted), and dishes can be reordered by drag or by arrow keys.
- **Sides** (`meal: "Side"`) can go on any slot but are never chosen as the main. Use `fitsMeal` and `isMainFor`. "Pick for me" and "Fill empty dinners" must never choose a side.
- **Notes** are ids that start with `note:` ("note:Takeout", free text). Quick options are Leftovers, Takeout and Eating out. Notes never add items to the shopping list.
- **Weekly routine**: what repeats is stored as `routine[dow][meal] = ids`, with Monday = 0. A key in `plan[date]` overrides the routine for that week only. **An explicit empty list counts as an override** (it clears that night). If a write matches the routine exactly, the override is deleted. That logic is in `resolveSlot` and `writeSlot`.
- **Each household sets its own routine.** The old family routine was built into the code and has been removed, so `DEFAULT_ROUTINE = {}`. Don't add household-specific data to the code. Tests seed a routine themselves.
- **Removing recipes**: a built-in recipe is *hidden* (`hidden` ids, which sync, and can be restored from the bottom of Recipes). A custom recipe is deleted outright. A hidden recipe still resolves through `getRecipe`, so a night that already uses it keeps showing it.
- **Favorites** get their own section at the top of both the book and the picker (`splitFavorites`).
- **Tags** are a fixed list in display order: Kids, Quick, Italian, Puerto Rican, Grill, Cold weather, Summer. They are combined with AND and kept behind a Filters button with a badge. To add a tag, update both the `Tag` type in `recipes.ts` and `TAGS` in `lib/recipes.js`. A test checks that every recipe uses only known tags.

### Data
- **Recipe ids are permanent.** A rename keeps the old id (for example, "Pork chops & arroz" became "Chuletas" with the same id), because plans, routines, favorites and hidden lists refer to recipes by id. If a recipe has no `id`, its id is the slug of `mealName`. Never change an existing slug without also setting `id` to the old value.
- **Custom recipes are saved raw**, in the same shape as `recipes.ts` entries plus `id` and `custom: true`. `normalise()` parses them the same way as built-ins: it splits ingredients on newlines or commas, strips step numbers, treats bare URLs as links rather than steps, and treats `tbd`/`n/a`/empty as no recipe. All lookups go through `RecipesContext` (`useRecipes()`), which merges built-in and custom recipes.
- **Old data shapes must still load.** For example, `toList` accepts a legacy single id or null. When you change a stored shape, read the old shape too and add a test for it.
- **localStorage keys** are `meals.<key>.v1`, plus `meals.household.v1` (household code), `meals.account.v1` (signed-in user) and `meals.dirty.v1` (keys with unsent edits, so a reload before sign-in or reconnecting doesn't lose them). If you change a key's meaning in a way the old shape can't handle, bump the version suffix.
- **Dates** are local ISO `YYYY-MM-DD` strings built with `toISODate` and read with `parseISODate`. Never use `new Date("YYYY-MM-DD")`, because it parses as UTC and the date drifts by a day. Weeks start on Monday (`startOfWeek`).
- Shopping list `checked` and `extras` are keyed by week.

### Sync
- **Rejected: Firebase/Firestore.** The `firebase-sync` branch was never merged. The project chose its own small Python API with Postgres instead.
- **Sign in with Google; the household code is only an invite.** (Changed in October 2026 from code-only sharing, where the code was the only credential.) The page renders Google Identity Services' button (`GoogleButton.jsx`), sends the ID token to `POST /api/auth/google`, and the API verifies it with `google-auth` and sets an HttpOnly, SameSite=Lax session cookie (`meals_session`, path `/api`, 90 days; only its SHA-256 is stored). A user (Google `sub`) belongs to at most one household (`users.household`). `/api/household` reads and writes the signed-in user's household; there is no endpoint that reads a household by code. Chosen because it is free, needs no email sending, and kept the small FastAPI + Postgres stack. The client ID comes from `GOOGLE_CLIENT_ID` on the server via `GET /api/me`, so there is one setting, not a build-time one.
- **Codes** are 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, which leaves out look-alike characters so a code can be read aloud. Creating a household seeds the server with that phone's data. Joining replaces a phone's data with the server's. A share link `?join=CODE` joins once and removes the parameter; signed out, it remembers the code and opens Sync to sign in.
- **The phone remembers its household** (`meals.household.v1`) and account (`meals.account.v1`). Signing in rejoins a remembered household (this is how phones from before sign-in migrated), keeping unsent edits. If the account is already in a different household, the server wins and unsent edits are dropped. Signing out keeps the phone's data and leaves it working alone.
- **Local first.** `useHousehold` always caches to localStorage, and without a code the app works fully offline on one phone.
- **Wire protocol**: `PATCH` replaces only the top-level keys it sends (`jsonb ||`, last write wins per key). `GET ?since=<version>` returns `{changed:false}` when nothing has changed. The version is the row's `updated_at` timestamp (and `+` arriving as a space is handled). The client debounces writes by 500 ms, polls every 5 s while the tab is visible, and never overwrites a key that has unsent local edits (`dirty`). After a PATCH the client **does not** adopt the returned version, so the next poll fetches the whole document and picks up anything another phone wrote in between. A key is only cleared from `dirty` if it wasn't edited again while the request was out.
- **Status values**: `local`, `signed-out` (a household but no session; any 401 clears the cached account and stops polling), `connecting`, `synced`, `offline` (fetch threw, status 0), `error`, `missing` (404, polling stops).
- **Adding a synced key** means touching all of these: `SYNC_KEYS` in `api/store.py` **and** `src/hooks/useHousehold.js`, the `Document` model in `api/index.py`, the defaults passed to `useHousehold` in `App.jsx`, a setter wrapped in `update(key, …)`, and API tests and hook tests.

### UI
- **No component library.** Bootstrap was removed. Everything is in one stylesheet, `src/styles.css`, built on tokens (`--bg`, `--surface`, `--ink`, `--green`, `--r-md`, ...) with dark mode under `prefers-color-scheme`. Use the tokens and existing classes, and don't use inline styles.
- **Mobile first.** The breakpoints are 760/761 px (phone versus larger screens) and 400 px for small phones. Respect `prefers-reduced-motion`.
- **Every modal is a `Sheet`.** It is built on the native `<dialog>` with `showModal()`, which provides Escape, focus trapping and the backdrop. The **dialog itself is a full-viewport overlay, and `.sheet-inner` is positioned inside it with flexbox.** That makes it a bottom sheet on phones and a centred dialog on larger screens. Don't position the `<dialog>` element at the bottom: iOS Safari won't show it. Browsers without the dialog API get the `open` attribute instead. Scroll resets when a sheet opens.
- **The picker serves two purposes.** A slot is `{date, meal}` for a night or `{dow, meal}` for the routine (titled "Every Wednesday"). `isRoutineSlot(slot)` is `slot.date === undefined`. Closing a routine picker goes back to the Routine sheet.
- **Feedback is a short toast** (`setToast`, 2.2 s) written as a plain sentence: "Tacos added to Tue", "Chuletas every Sunday". Destructive actions use `window.confirm`, and the message says whether the action can be undone.
- **Copy style**: plain, short sentences in everyday words, with no jargon ("Remove from book", "No recipes match").

## Testing
- **Vitest** replaced react-scripts' Jest (`vitest.config.mjs`, jsdom, globals). Run it with `npm test`. Unit tests are in `src/lib/__tests__`, and UI flow tests are in `src/__tests__/App.test.jsx`.
- **Query by role and accessible name** (`getByRole("dialog")`, `getByRole("button", {name})`, `getByLabelText`). Use the `openSheet(title)` helper to find the open dialog. Use buttons and labels a screen reader can name, so tests can find them too.
- `setupTests.js` adds a stand-in for `showModal`/`close` (jsdom has no dialog API) and stubs `window.confirm` to return true.
- Sync tests use `src/__tests__/fakeServer.js`, an in-memory copy of the API (one phone's session, one household `ABC234`, version `vN`). Keep it matching `api/index.py`. `fakeGoogle(name)` in the same file stands in for Google's script: its button signs in as `name@example.com`.
- Clear localStorage in `beforeEach`. If a test needs a routine, seed `meals.routine.v1` itself.
- **API**: `python -m pytest api -q` uses `MEALS_STORE=memory` and needs no database. A fixture clears the store and overrides `google_verifier` with a fake (credential `"alice"` signs in as alice@example.com), so no test talks to Google.
- **Node 22** (as in CI). Vitest 5 fails to start on older Node (20.9 did); `nvm use 22`.
- Each feature commit adds or updates a test that describes how a user experiences the change ("a removed recipe still shows on a night that already uses it").

## CI and checks before committing
- GitHub Actions (`.github/workflows/ci.yml`) has two jobs: **web** (`npm ci`, `npm test`, `npm run build` with `CI=true`, so **eslint warnings fail the build**) and **api** (Python 3.12, pytest).
- Before committing, run `npm test`, `CI=true npm run build` and `python -m pytest api -q`. Remove unused imports and variables, because the build fails on them. The only ESLint override turns off two testing-library rules, and only for test files.
- Never commit `.env`. `DATABASE_URL` goes in `.env` locally and in Vercel's environment variables.

## Commits
- The title is in the imperative and describes the user-visible change ("Let each household set its own weekly routine"). The body is a short paragraph of prose saying what changed and why, including any compatibility notes ("Old single-dish plans still load.").
- Keep one feature per commit. Put cleanup in its own commit ("Clean up: remove dead code…"). Larger work goes on a branch and is merged with a summary title ("Merge python-backend: shared sync via Python API").
- Update `README.md` whenever setup, features or how to run something changes.

## Known gaps (check before building on sync)
- **Merging is per whole key.** Two phones editing different days of `plan` at the same moment can overwrite each other, because the whole `plan` object is replaced. Finer-grained merging would need a change to the protocol.
- **A code never expires.** Anyone with a Google account and the code can join, and there is no way yet to issue a new code or remove another member. Nothing limits request rates.
- **One household per user.** Joining another household moves the account there.

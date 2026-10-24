# Meals & Recipes

A weekly meal planner built around our family recipe book.

- **Plan** – one dinner per night, Monday to Sunday, with lunch and breakfast available per day when you need them. Tap a night to pick a recipe, write a note ("Takeout"), or let the app pick for you. A night can hold several dishes, including sides. Meals you make every week (Sunday meatballs, Friday takeout) repeat automatically and can be overridden for a single week. Star recipes to keep them in a Favorites section.
- **Recipes** – search by name or ingredient, filter by meal, and add any recipe straight to a day.
- **Shop** – a shopping list built from the week's planned meals, grouped by recipe, with check-off, extra items, and copy-to-clipboard.

Built-in recipes live in `src/recipes.ts`. Recipes added in the app, the plan, routine, favorites and shopping list are cached in the browser's local storage and, once signed in and in a household, mirrored to the sync API (see below).

## Running

```
npm install
npm start      # http://localhost:3000
npm test       # Vitest: parser, plan and date units plus search / add recipe / plan flows
npm run build  # production build in /build
```

GitHub Actions runs the tests and a production build on every push and pull request (`.github/workflows/ci.yml`).

Deployed with Vercel: https://meals-and-recipes-web.vercel.app/

## Sharing between phones

Sync is a small Python API (`api/index.py`, FastAPI) that keeps one document per household in Postgres. Everyone signs in with Google. One person starts a household and shares its six-character code or link; the others sign in and join with it. After that the plan, routine, recipes, favorites and shopping list stay in step. The code is only an invite: on its own it doesn't read or change anything.

**Setup, once**

1. Create a free Postgres database at https://neon.tech and copy its pooled connection string.
2. Put it in `.env` as `DATABASE_URL=...` (see `.env.example`). Never commit `.env`.
3. Google sign-in uses the OAuth client in the "Meals Recipes" Google Cloud project, whose ID is built into `api/index.py` (`DEFAULT_GOOGLE_CLIENT_ID`; it isn't secret). Its Authorized JavaScript origins are `https://meals-and-recipes-web.vercel.app`, `http://localhost:3000` and `http://localhost`; add any new address there (Google Auth Platform, Clients). To use a different client, set `GOOGLE_CLIENT_ID` in `.env` or Vercel.
4. Add the same `DATABASE_URL` in Vercel under Settings, Environment Variables, then redeploy. Vercel runs `api/index.py` as a serverless function automatically.

In the app, tap **Sync** in the top bar and sign in with Google. One person taps "Create a code", the others sign in and enter it under "Join" (or open the share link). Phones that were already sharing a code before sign-in existed just sign in once and rejoin their household. Vercel preview URLs aren't in the allowed origins, so sign-in only works on the main URL and locally.

**Running the API locally**

```
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt pytest httpx
.venv/bin/uvicorn api.index:app --reload --port 8000   # in one terminal
npm start                                                # in another; /api is proxied to :8000
.venv/bin/python -m pytest api -q                        # API tests (no database needed)
```

The tables are created on first use. If `DATABASE_URL` is missing the API refuses to start, and the app keeps working on one phone. `.claude/launch.json` starts the API with an in-memory store (nothing touches Neon).

# Meals & Recipes

A weekly meal planner built around our family recipe book.

- **Plan** – one dinner per night, Monday to Sunday. Tap a night to pick a recipe, write a note ("Pizza or McDonald's"), or let the app pick for you. Meals you make every week (Sunday meatballs, Friday takeout) repeat automatically and can be overridden for a single week.
- **Recipes** – search by name or ingredient, filter by meal, and add any recipe straight to a day.
- **Shop** – a shopping list built from the week's planned meals, grouped by recipe, with check-off, extra items, and copy-to-clipboard.

Recipes live in `src/recipes.ts`. The plan, routine and shopping list are saved in the browser's local storage, and optionally shared between phones (see below).

## Sharing between phones

Sync uses Firebase Firestore with a shared household code. Set it up once:

1. Create a project at https://console.firebase.google.com (Analytics off is fine).
2. Build > Authentication > Sign-in method: enable **Anonymous**.
3. Build > Firestore Database > Create database (production mode), then paste the contents of `firestore.rules` into the Rules tab and publish.
4. Project settings > Your apps > Add a web app. Copy `apiKey`, `authDomain`, `projectId` and `appId`.
5. Put them in `.env.local` (see `.env.example`) for local use, and add the same four variables in Vercel under Settings > Environment Variables, then redeploy.

In the app, tap **Sync** in the top bar. One phone taps "Create a code", the other enters that code under "Join". From then on both phones edit the same plan, routine and shopping list, live, and it keeps working offline.

## Running

```
npm install
npm start      # http://localhost:3000
npm run build  # production build in /build
```

Deployed with Vercel: https://meals-and-recipes-web.vercel.app/

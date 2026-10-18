# Meals & Recipes

A weekly meal planner built around our family recipe book.

- **Plan** – one dinner per night, Monday to Sunday. Tap a night to pick a recipe, write a note ("Pizza or McDonald's"), or let the app pick for you. Meals you make every week (Sunday meatballs, Friday takeout) repeat automatically and can be overridden for a single week.
- **Recipes** – search by name or ingredient, filter by meal, and add any recipe straight to a day.
- **Shop** – a shopping list built from the week's planned meals, grouped by recipe, with check-off, extra items, and copy-to-clipboard.

Built-in recipes live in `src/recipes.ts`. Recipes added in the app, the plan, routine and shopping list are saved in the browser's local storage (keys `meals.*.v1`). Each of those is one JSON value, so a sync layer only needs to mirror those keys.

## Running

```
npm install
npm start      # http://localhost:3000
npm test       # Vitest: parser, plan and date units plus search / add recipe / plan flows
npm run build  # production build in /build
```

GitHub Actions runs the tests and a production build on every push and pull request (`.github/workflows/ci.yml`).

Deployed with Vercel: https://meals-and-recipes-web.vercel.app/

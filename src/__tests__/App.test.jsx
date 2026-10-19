import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "../App";
import { fakeServer } from "./fakeServer";

// The family's routine, as a household would have set it up.
const ROUTINE = { 0: { Dinner: ["note:Leftover meatballs"] }, 4: { Dinner: ["note:takeout"] }, 6: { Dinner: ["meatballs"] } };

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("meals.routine.v1", JSON.stringify(ROUTINE));
});

/** The open sheet whose title matches. */
function openSheet(title) {
  const dialog = screen
    .getAllByRole("dialog", { hidden: true })
    .find((d) => d.hasAttribute("open") && within(d).queryByRole("heading", { name: title }));
  expect(dialog).toBeTruthy();
  return within(dialog);
}

function goTo(tab) {
  const nav = screen.getByRole("navigation", { name: "Sections" });
  fireEvent.click(within(nav).getByRole("button", { name: new RegExp(`^${tab}`) }));
}

describe("search", () => {
  test("filters the recipe book by name and by ingredient", async () => {
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getByRole("searchbox", { name: "Search recipes" });

    await user.type(search, "taco");
    expect(screen.getByText("Tacos")).toBeInTheDocument();
    expect(screen.queryByText("Meatballs")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "sofrito");
    expect(screen.getByText("Empanadas")).toBeInTheDocument();
    expect(screen.getByText("Arroz con Gandules")).toBeInTheDocument();
    expect(screen.queryByText("Tacos")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzzz");
    expect(screen.getByText("No recipes match")).toBeInTheDocument();
  });

  test("meal and tag filters narrow the list", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Breakfast" }));
    expect(screen.getByText("Pancakes")).toBeInTheDocument();
    expect(screen.queryByText("Tacos")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^All\s*\d+$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    fireEvent.click(screen.getByRole("button", { name: "Puerto Rican" }));
    expect(screen.getByText("Empanadas")).toBeInTheDocument();
    expect(screen.queryByText("Tacos")).not.toBeInTheDocument();
  });
});

describe("adding recipes", () => {
  test("a new recipe appears in the book, opens, and is still there after a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Add recipe" }));
    const form = openSheet("New recipe");
    await user.type(form.getByLabelText("Name"), "Arroz con Pollo");
    fireEvent.click(form.getByRole("button", { name: "Puerto Rican" }));
    await user.type(form.getByLabelText(/Ingredients/), "2 lb chicken{enter}2 cups rice");
    await user.type(form.getByLabelText(/Steps/), "Brown chicken.{enter}Add rice.");
    fireEvent.click(form.getByRole("button", { name: "Add to book" }));

    const detail = openSheet("Arroz con Pollo");
    expect(detail.getByText("Dinner. Added by you.")).toBeInTheDocument();
    expect(detail.getByLabelText("2 lb chicken")).toBeInTheDocument();
    expect(detail.getByText("Add rice.")).toBeInTheDocument();
    expect(detail.getByRole("button", { name: "Edit" })).toBeInTheDocument();

    unmount();
    render(<App />);
    expect(screen.getByText("Arroz con Pollo")).toBeInTheDocument();
    expect(screen.getByText("Yours")).toBeInTheDocument();
  });

  test("the save button stays disabled until the recipe has a name", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Add recipe" }));
    const form = openSheet("New recipe");
    expect(form.getByRole("button", { name: "Add to book" })).toBeDisabled();
    fireEvent.change(form.getByLabelText("Name"), { target: { value: "X" } });
    expect(form.getByRole("button", { name: "Add to book" })).toBeEnabled();
  });

  test("an added recipe can be edited and deleted", async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Add recipe" }));
    await user.type(openSheet("New recipe").getByLabelText("Name"), "Temp Dish");
    fireEvent.click(openSheet("New recipe").getByRole("button", { name: "Add to book" }));

    fireEvent.click(openSheet("Temp Dish").getByRole("button", { name: "Edit" }));
    const form = openSheet("Edit recipe");
    await user.clear(form.getByLabelText("Name"));
    await user.type(form.getByLabelText("Name"), "Renamed Dish");
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Renamed Dish")).toBeInTheDocument();
    expect(screen.queryByText("Temp Dish")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Renamed Dish/ }));
    fireEvent.click(openSheet("Renamed Dish").getByRole("button", { name: "Edit" }));
    fireEvent.click(openSheet("Edit recipe").getByRole("button", { name: "Delete" }));
    expect(screen.queryByText("Renamed Dish")).not.toBeInTheDocument();
  });
});

describe("weekly routine", () => {
  test("starts empty for a new household", () => {
    window.localStorage.clear();
    render(<App />);
    goTo("Plan");
    expect(screen.queryByRole("button", { name: /^Sunday dinner: Meatballs/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weekly routine" }));
    expect(openSheet("Weekly routine").getByText(/Nothing repeats yet/)).toBeInTheDocument();
  });

  test("a household sets its own routine from the routine sheet", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(<App />);
    goTo("Plan");
    fireEvent.click(screen.getByRole("button", { name: "Weekly routine" }));
    fireEvent.click(openSheet("Weekly routine").getByRole("button", { name: /^Wednesday dinner routine: nothing/ }));

    const picker = openSheet("Every Wednesday");
    await user.type(picker.getByRole("searchbox"), "tacos");
    fireEvent.click(picker.getByRole("button", { name: /^Tacos/ }));

    // Back on the routine sheet, Wednesday shows tacos; the week grid shows it every week.
    expect(openSheet("Weekly routine").getByRole("button", { name: /^Wednesday dinner routine: Tacos/ })).toBeInTheDocument();
    fireEvent.click(openSheet("Weekly routine").getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: /^Wednesday dinner: Tacos/ })).toHaveTextContent("every week");
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(screen.getByRole("button", { name: /^Wednesday dinner: Tacos/ })).toBeInTheDocument();
  });

  test("a routine dish can be removed from the routine sheet", () => {
    render(<App />);
    goTo("Plan");
    fireEvent.click(screen.getByRole("button", { name: "Weekly routine" }));
    fireEvent.click(openSheet("Weekly routine").getByRole("button", { name: /^Sunday dinner routine: Meatballs/ }));
    fireEvent.click(openSheet("Every Sunday").getByRole("button", { name: "Remove Meatballs" }));
    fireEvent.click(openSheet("Every Sunday").getByRole("button", { name: "Close" }));
    fireEvent.click(openSheet("Weekly routine").getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: /^Sunday dinner: nothing planned/ })).toBeInTheDocument();
  });
});

describe("share link", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  test("opening ?join=CODE joins that household and cleans the URL", async () => {
    const server = fakeServer();
    server.seed({ plan: { "2026-10-20": { Dinner: ["empanadas"] } }, favorites: [] });
    vi.spyOn(window, "fetch").mockImplementation(server.fetch);
    window.history.replaceState({}, "", "/?join=abc234");

    render(<App />);
    await screen.findByText("Joined the household. Your plans are now shared.");
    expect(window.location.search).toBe("");
    expect(JSON.parse(window.localStorage.getItem("meals.household.v1"))).toBe("ABC234");
    expect(screen.getByRole("button", { name: /^Sync: Synced|^Sync: Connecting/ })).toHaveTextContent("Shared");
  });

  test("a link with an unknown code explains itself and leaves the phone alone", async () => {
    const server = fakeServer();
    vi.spyOn(window, "fetch").mockImplementation(server.fetch);
    window.history.replaceState({}, "", "/?join=ZZZZZZ");

    render(<App />);
    await screen.findByText("That share link doesn't match a household.");
    expect(window.location.search).toBe("");
    expect(window.localStorage.getItem("meals.household.v1")).toBe("null");
  });

  test("the Sync sheet offers the share link", async () => {
    const server = fakeServer();
    vi.spyOn(window, "fetch").mockImplementation(server.fetch);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Sync:/ }));
    fireEvent.click(openSheet("Plan together").getByRole("button", { name: "Create a code" }));
    const sheet = await screen.findByText("ABC234");
    expect(sheet).toBeInTheDocument();
    expect(screen.getByText(`${window.location.origin}/?join=ABC234`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share link" })).toBeInTheDocument();
  });
});

describe("removing recipes", () => {
  test("a built-in recipe can be removed from the book and put back", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Hot Dogs/ }));
    fireEvent.click(openSheet("Hot Dogs").getByRole("button", { name: "Remove from book" }));
    expect(screen.queryByRole("button", { name: /^Hot Dogs/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("1 removed from the book"));
    fireEvent.click(screen.getByRole("button", { name: "Put back" }));
    expect(screen.getByRole("button", { name: /^Hot Dogs/ })).toBeInTheDocument();
    expect(screen.queryByText(/removed from the book/)).not.toBeInTheDocument();
  });

  test("a removed recipe still shows on a night that already uses it", async () => {
    const user = userEvent.setup();
    render(<App />);
    goTo("Plan");
    const empty = screen.getAllByRole("button", { name: /dinner: nothing planned$/ })[0];
    const dayName = empty.getAttribute("aria-label").split(" ")[0];
    fireEvent.click(empty);
    await user.type(openSheet(`${dayName} dinner`).getByRole("searchbox"), "tacos");
    fireEvent.click(openSheet(`${dayName} dinner`).getByRole("button", { name: /^Tacos/ }));

    goTo("Recipes");
    fireEvent.click(screen.getByRole("button", { name: /^Tacos/ }));
    fireEvent.click(openSheet("Tacos").getByRole("button", { name: "Remove from book" }));
    goTo("Plan");
    expect(screen.getByRole("button", { name: new RegExp(`^${dayName} dinner: Tacos`) })).toBeInTheDocument();
  });
});

describe("favorites", () => {
  test("starring a recipe puts it in a Favorites section at the top of the book and the picker", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Zesty Fried Chicken/ }));
    fireEvent.click(openSheet("Zesty Fried Chicken").getByRole("button", { name: "Add to favorites" }));
    fireEvent.click(openSheet("Zesty Fried Chicken").getByRole("button", { name: "Close" }));

    // A Favorites section appears first, holding the starred recipe.
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings[0]).toBe("Favorites");
    const rows = screen.getAllByRole("button", { name: /ingredients/ }).map((b) => b.textContent);
    expect(rows[0]).toMatch(/Zesty Fried Chicken/);
    expect(screen.getByRole("button", { name: /^Zesty Fried Chicken/ }).querySelector(".fav")).toBeTruthy();

    goTo("Plan");
    fireEvent.click(screen.getAllByRole("button", { name: /dinner: nothing planned$/ })[0]);
    const picker = screen.getAllByRole("dialog", { hidden: true }).find((d) => d.hasAttribute("open"));
    expect(within(picker).getByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    const first = within(picker).getAllByRole("button", { name: /ingredients/ })[0];
    expect(first).toHaveTextContent("Zesty Fried Chicken");
  });

  test("the star can be removed again and favorites persist", () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Hot Dogs/ }));
    fireEvent.click(openSheet("Hot Dogs").getByRole("button", { name: "Add to favorites" }));
    unmount();
    render(<App />);
    const row = screen.getByRole("button", { name: /^Hot Dogs/ });
    expect(row.querySelector(".fav")).toBeTruthy();
    fireEvent.click(row);
    fireEvent.click(openSheet("Hot Dogs").getByRole("button", { name: "Remove from favorites" }));
    // The row must exist; only the star inside it should be gone.
    // eslint-disable-next-line testing-library/prefer-presence-queries
    expect(screen.getByRole("button", { name: /^Hot Dogs/ }).querySelector(".fav")).toBeNull();
  });
});

describe("adding to the plan", () => {
  test("picking a recipe for a night puts it on the calendar and the shopping list", async () => {
    const user = userEvent.setup();
    render(<App />);
    goTo("Plan");

    const empty = screen.getAllByRole("button", { name: /dinner: nothing planned$/ })[0];
    const dayName = empty.getAttribute("aria-label").split(" ")[0];
    fireEvent.click(empty);

    const picker = openSheet(`${dayName} dinner`);
    await user.type(picker.getByRole("searchbox"), "tacos");
    fireEvent.click(picker.getByRole("button", { name: /^Tacos/ }));

    expect(screen.getByRole("button", { name: new RegExp(`^${dayName} dinner: Tacos`) })).toBeInTheDocument();
    expect(screen.getByText(/of 7 dinners planned/)).toBeInTheDocument();

    goTo("Shop");
    expect(screen.getByRole("heading", { name: /^Tacos/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Taco kit")).toBeInTheDocument();
  });

  test("a side like rice can be added to a night", async () => {
    const user = userEvent.setup();
    render(<App />);
    goTo("Plan");
    fireEvent.click(screen.getByRole("button", { name: /^Sunday dinner: Meatballs/ }));
    const picker = openSheet("Sunday dinner");
    fireEvent.click(picker.getByRole("button", { name: "Sides" }));
    expect(picker.getByRole("button", { name: /^Potato Salad/ })).toBeInTheDocument();
    expect(picker.queryByRole("button", { name: /^Tacos/ })).not.toBeInTheDocument();
    await user.type(picker.getByRole("searchbox"), "rice");
    fireEvent.click(picker.getByRole("button", { name: /^White Rice/ }));
    expect(screen.getByRole("button", { name: /^Sunday dinner: Meatballs and White Rice/ })).toBeInTheDocument();
  });

  test("dishes on a night can be reordered", async () => {
    const user = userEvent.setup();
    render(<App />);
    goTo("Plan");
    fireEvent.click(screen.getByRole("button", { name: /^Sunday dinner: Meatballs/ }));
    let picker = openSheet("Sunday dinner");
    await user.type(picker.getByRole("searchbox"), "rice");
    fireEvent.click(picker.getByRole("button", { name: /^White Rice/ }));
    expect(screen.getByRole("button", { name: /^Sunday dinner: Meatballs and White Rice/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Sunday dinner: Meatballs and/ }));
    picker = openSheet("Sunday dinner");
    expect(picker.getByRole("button", { name: "Move Meatballs up" })).toBeDisabled();
    fireEvent.click(picker.getByRole("button", { name: "Move White Rice up" }));
    expect(screen.getByRole("button", { name: /^Sunday dinner: White Rice and Meatballs/ })).toBeInTheDocument();

    // Drag Meatballs back on top.
    const items = picker.getByRole("list", { name: "Already planned" }).querySelectorAll("li");
    const dataTransfer = { effectAllowed: "", setData: () => {}, getData: () => "meatballs" };
    fireEvent.dragStart(items[1], { dataTransfer });
    fireEvent.dragOver(items[0], { dataTransfer });
    fireEvent.drop(items[0], { dataTransfer });
    expect(screen.getByRole("button", { name: /^Sunday dinner: Meatballs and White Rice/ })).toBeInTheDocument();
  });

  test("a night can hold more than one dish", async () => {
    const user = userEvent.setup();
    render(<App />);
    goTo("Plan");

    // Sunday already has Meatballs from the weekly routine.
    fireEvent.click(screen.getByRole("button", { name: /^Sunday dinner: Meatballs/ }));
    const picker = openSheet("Sunday dinner");
    await user.type(picker.getByRole("searchbox"), "green beans");
    fireEvent.click(picker.getByRole("button", { name: /^Green beans and sausage/ }));

    expect(screen.getByRole("button", { name: /^Sunday dinner: Meatballs and Green beans and sausage/ })).toBeInTheDocument();
  });

  test("a recipe can be added to a night from the recipe book", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Hot Dogs/ }));
    const detail = openSheet("Hot Dogs");
    fireEvent.click(detail.getByRole("button", { name: "Add to a dinner this week" }));
    fireEvent.click(detail.getAllByRole("button", { name: /^Dinner/ })[0]);

    expect(screen.getByRole("heading", { name: /week|–/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dinner: .*Hot Dogs/ })).toBeInTheDocument();
  });

  test("lunch can be added to a day from the picker and shows under the dinner", async () => {
    const user = userEvent.setup();
    render(<App />);
    goTo("Plan");

    // No day has a lunch until one is added.
    expect(screen.getByRole("button", { name: /^Friday dinner: Takeout/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: / lunch: / })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Monday dinner/ }));
    const picker = openSheet("Monday dinner");
    fireEvent.click(picker.getByRole("tab", { name: "Lunch" }));
    expect(screen.getByRole("heading", { name: "Monday lunch" })).toBeInTheDocument();
    const lunchPicker = openSheet("Monday lunch");
    await user.type(lunchPicker.getByRole("searchbox"), "escarole");
    fireEvent.click(lunchPicker.getByRole("button", { name: /^Escarole Soup/ }));

    expect(screen.getByRole("button", { name: /^Monday lunch: Escarole Soup/ })).toBeInTheDocument();
    // Dinner count is unaffected by lunches.
    expect(screen.getByText(/of 7 dinners planned/)).toBeInTheDocument();

    goTo("Shop");
    expect(screen.getByRole("heading", { name: /^Escarole Soup/ })).toBeInTheDocument();
  });

  test("the plan is still there after a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    goTo("Plan");
    const empty = screen.getAllByRole("button", { name: /dinner: nothing planned$/ })[0];
    const dayName = empty.getAttribute("aria-label").split(" ")[0];
    fireEvent.click(empty);
    await user.type(openSheet(`${dayName} dinner`).getByRole("searchbox"), "hot dogs");
    fireEvent.click(openSheet(`${dayName} dinner`).getByRole("button", { name: /^Hot Dogs/ }));
    unmount();

    render(<App />);
    goTo("Plan");
    expect(screen.getByRole("button", { name: new RegExp(`^${dayName} dinner: Hot Dogs`) })).toBeInTheDocument();
  });
});

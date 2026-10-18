import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

beforeEach(() => {
  window.localStorage.clear();
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
    fireEvent.click(detail.getAllByRole("button", { name: "Add here" })[0]);

    expect(screen.getByRole("heading", { name: /week|–/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dinner: Hot Dogs/ })).toBeInTheDocument();
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

import { useSet } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

const toppings = ["Cheese", "Olives", "Basil"];

function Pizza() {
  const [chosen, { toggle, clear }] = useSet<string>(["Cheese"]);
  return (
    <>
      {toppings.map((topping) => (
        <label key={topping}>
          <input
            type="checkbox"
            checked={chosen.has(topping)}
            onChange={() => {
              toggle(topping);
            }}
          />
          {topping}
        </label>
      ))}
      <button type="button" onClick={clear}>
        None
      </button>
      <p>{chosen.size} chosen</p>
    </>
  );
}

describe("useSet in a real browser", () => {
  it("toggles values with checkboxes and clears them", async () => {
    const screen = await render(<Pizza />);
    await expect.element(screen.getByRole("checkbox", { name: "Cheese" })).toBeChecked();

    await userEvent.click(screen.getByRole("checkbox", { name: "Olives" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Cheese" }));
    await expect.element(screen.getByRole("checkbox", { name: "Olives" })).toBeChecked();
    await expect.element(screen.getByRole("checkbox", { name: "Cheese" })).not.toBeChecked();
    await expect.element(screen.getByText("1 chosen")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "None" }));
    await expect.element(screen.getByText("0 chosen")).toBeVisible();
    await expect.element(screen.getByRole("checkbox", { name: "Olives" })).not.toBeChecked();
  });
});

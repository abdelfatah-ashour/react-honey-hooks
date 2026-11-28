import { useMap } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

const fruits = ["Apple", "Pear"];

function Basket() {
  const [basket, { set, remove, clear }] = useMap<string, number>();
  return (
    <>
      {fruits.map((fruit) => (
        <button
          key={fruit}
          type="button"
          onClick={() => {
            set(fruit, (basket.get(fruit) ?? 0) + 1);
          }}
        >
          Add {fruit}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          remove("Apple");
        }}
      >
        Remove apples
      </button>
      <button type="button" onClick={clear}>
        Empty
      </button>
      <ul aria-label="Basket">
        {[...basket].map(([fruit, count]) => (
          <li key={fruit}>
            {fruit}: {count}
          </li>
        ))}
      </ul>
    </>
  );
}

describe("useMap in a real browser", () => {
  it("adds, counts, removes and clears entries with clicks", async () => {
    const screen = await render(<Basket />);
    const basket = screen.getByRole("list", { name: "Basket" });

    await userEvent.click(screen.getByRole("button", { name: "Add Apple" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Apple" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Pear" }));
    await expect.element(basket).toHaveTextContent("Apple: 2Pear: 1");

    await userEvent.click(screen.getByRole("button", { name: "Remove apples" }));
    await expect.element(basket).toHaveTextContent("Pear: 1");

    await userEvent.click(screen.getByRole("button", { name: "Empty" }));
    await expect.element(basket).toHaveTextContent("");
  });
});

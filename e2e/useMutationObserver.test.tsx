import { useRef, useState } from "react";
import { useMutationObserver } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function TodoList() {
  const ref = useRef<HTMLUListElement>(null);
  const [items, setItems] = useState<string[]>([]);
  const [changes, setChanges] = useState(0);
  useMutationObserver(ref, (mutations) => {
    setChanges((count) => count + mutations.length);
  });

  return (
    <>
      <ul ref={ref}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          setItems((current) => [...current, `Task ${String(current.length + 1)}`]);
        }}
      >
        Add task
      </button>
      <button
        type="button"
        onClick={() => {
          setItems([]);
        }}
      >
        Clear
      </button>
      <p>Changes seen: {changes}</p>
    </>
  );
}

describe("useMutationObserver in a real browser", () => {
  it("reports each item React adds or removes in the list", async () => {
    const screen = await render(<TodoList />);

    await userEvent.click(screen.getByRole("button", { name: "Add task" }));
    await expect.element(screen.getByText("Changes seen: 1")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Add task" }));
    await expect.element(screen.getByText("Changes seen: 2")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await expect.element(screen.getByText(/^Changes seen: [34]$/)).toBeVisible();
  });
});

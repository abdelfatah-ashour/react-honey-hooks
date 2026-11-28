import { useState } from "react";
import { useDeepCompareEffect } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Results({ onFetch }: { onFetch: (filters: { color: string }) => void }) {
  const [color, setColor] = useState("red");
  const [clicks, setClicks] = useState(0);
  // A new object every render: a plain useEffect would fetch on every click of "Re-render".
  const filters = { color };
  useDeepCompareEffect(() => {
    onFetch(filters);
  }, [filters]);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setClicks(clicks + 1);
        }}
      >
        Re-render ({clicks})
      </button>
      <button
        type="button"
        onClick={() => {
          setColor("blue");
        }}
      >
        Blue
      </button>
    </>
  );
}

describe("useDeepCompareEffect in a real browser", () => {
  it("fetches again only when the filters' contents change", async () => {
    const fetched: string[] = [];
    const onFetch = ({ color }: { color: string }) => {
      fetched.push(color);
    };
    const screen = await render(<Results onFetch={onFetch} />);

    await userEvent.click(screen.getByRole("button", { name: /Re-render/ }));
    await userEvent.click(screen.getByRole("button", { name: /Re-render/ }));
    await expect.element(screen.getByRole("button", { name: "Re-render (2)" })).toBeVisible();
    expect(fetched).toEqual(["red"]);

    await userEvent.click(screen.getByRole("button", { name: "Blue" }));
    await expect.poll(() => fetched).toEqual(["red", "blue"]);
  });
});

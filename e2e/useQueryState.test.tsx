import { useQuery, useQueryState } from "react-honey-hooks";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

let originalUrl: string;

beforeEach(() => {
  originalUrl = window.location.href;
});

afterEach(() => {
  window.history.replaceState(null, "", originalUrl);
});

function SortButtons() {
  const [{ params }, setQuery] = useQueryState<"sort">();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQuery({ sort: "price" }, { mode: "push" });
        }}
      >
        Sort by price
      </button>
      <button
        type="button"
        onClick={() => {
          setQuery({ sort: null });
        }}
      >
        Clear sort
      </button>
      <p>Buttons see: {params.sort ?? "none"}</p>
    </>
  );
}

/** A separate component that only reads, to show every reader on the page follows. */
function SortLabel() {
  const { params } = useQuery<"sort">();
  return <p>Label sees: {params.sort ?? "none"}</p>;
}

describe("useQueryState in a real browser", () => {
  it("writes the URL on click, updates every reader, and Back undoes a push", async () => {
    const screen = await render(
      <>
        <SortButtons />
        <SortLabel />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sort by price" }));
    await expect.element(screen.getByText("Label sees: price")).toBeVisible();
    await expect.element(screen.getByText("Buttons see: price")).toBeVisible();
    expect(new URL(window.location.href).searchParams.get("sort")).toBe("price");

    window.history.back();
    await expect.element(screen.getByText("Label sees: none")).toBeVisible();
  });

  it("removes the key when set to null", async () => {
    const screen = await render(<SortButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Sort by price" }));
    await expect.element(screen.getByText("Buttons see: price")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Clear sort" }));

    await expect.element(screen.getByText("Buttons see: none")).toBeVisible();
    expect(new URL(window.location.href).searchParams.has("sort")).toBe(false);
  });
});

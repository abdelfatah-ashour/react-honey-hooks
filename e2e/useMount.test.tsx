import { useRef, useState } from "react";
import { useMount } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Search() {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  useMount(() => {
    input.current?.focus();
  });
  return (
    <>
      <input
        ref={input}
        aria-label="Search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <p>Searching for {query}</p>
    </>
  );
}

describe("useMount in a real browser", () => {
  it("focuses the search box once on mount, so typing goes straight into it", async () => {
    const screen = await render(<Search />);
    await expect.element(screen.getByLabelText("Search")).toHaveFocus();

    await userEvent.keyboard("shoes");
    await expect.element(screen.getByText("Searching for shoes")).toBeVisible();
    await expect.element(screen.getByLabelText("Search")).toHaveFocus();
  });
});

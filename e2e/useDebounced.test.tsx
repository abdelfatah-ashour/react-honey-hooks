import { useState } from "react";
import { useDebouncedCallback, useDebouncedValue } from "react-honey-hooks";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Search({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const search = useDebouncedCallback(onSearch, 200);

  return (
    <>
      <input
        aria-label="Search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          search(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") search.flush();
        }}
      />
      <p>Results for: {debouncedQuery}</p>
    </>
  );
}

describe("useDebouncedValue and useDebouncedCallback in a real browser", () => {
  it("waits for typing to pause, then searches once for the whole query", async () => {
    const onSearch = vi.fn<(query: string) => void>();
    const screen = await render(<Search onSearch={onSearch} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Search" }), "honey");

    await expect.element(screen.getByText("Results for: honey")).toBeVisible();
    await vi.waitFor(() => {
      expect(onSearch).toHaveBeenCalledExactlyOnceWith("honey");
    });
  });

  it("searches straight away when Enter flushes the pending call", async () => {
    const onSearch = vi.fn<(query: string) => void>();
    const screen = await render(<Search onSearch={onSearch} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Search" }), "bee{Enter}");

    expect(onSearch).toHaveBeenCalledExactlyOnceWith("bee");
  });
});

import { useState } from "react";
import { useDebouncedEffect } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Search({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  useDebouncedEffect(
    () => {
      onSearch(query);
    },
    [query],
    150,
  );
  return (
    <input
      aria-label="Search"
      value={query}
      onChange={(event) => {
        setQuery(event.target.value);
      }}
    />
  );
}

describe("useDebouncedEffect in a real browser", () => {
  it("searches once, for the whole word, after typing stops", async () => {
    const searches: string[] = [];
    const onSearch = (query: string) => {
      searches.push(query);
    };
    const screen = await render(<Search onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText("Search"), "honey");
    await expect.poll(() => searches).toEqual(["honey"]);

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(searches).toEqual(["honey"]);
  });
});

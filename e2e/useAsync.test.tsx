import { useState } from "react";
import { useAsync } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

/**
 * A search that takes longer for shorter queries, so earlier responses would arrive last:
 * 1.5 s for one letter, 1 s for two, 0.5 s for three. Typing never pauses that long.
 */
function slowSearch(signal: AbortSignal, query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        resolve(`Results for "${query}"`);
      },
      600 - query.length * 100,
    );
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Search aborted", "AbortError"));
    });
  });
}

function Search({ aborted }: { aborted: string[] }) {
  const [query, setQuery] = useState("");
  const { status, data, run } = useAsync((signal: AbortSignal, value: string) => {
    signal.addEventListener("abort", () => {
      aborted.push(value);
    });
    return slowSearch(signal, value);
  });

  return (
    <>
      <input
        aria-label="Search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          void run(event.target.value);
        }}
      />
      <p>Status: {status}</p>
      <p>{data ?? "No results yet"}</p>
    </>
  );
}

describe("useAsync in a real browser", () => {
  it("shows only the newest search's results, aborting the earlier ones", async () => {
    const aborted: string[] = [];
    const screen = await render(<Search aborted={aborted} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Search" }), "bee");

    await expect.element(screen.getByText('Results for "bee"')).toBeVisible();
    await expect.element(screen.getByText("Status: success")).toBeVisible();
    expect(aborted).toEqual(["b", "be"]);
    // Past the time the aborted searches would have answered.
    await new Promise((resolve) => setTimeout(resolve, 1600));
    await expect.element(screen.getByText('Results for "bee"')).toBeVisible();
  });
});

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useDebouncedValue";

describe("useDebouncedValue demo", () => {
  it("searches for the typed text only once typing pauses", async () => {
    const screen = await render(<Demo />);
    const search = screen.getByRole("status");
    await expect.element(search).toHaveTextContent("Type to search");

    await userEvent.type(screen.getByRole("searchbox", { name: "Search hooks" }), "timer");
    // Straight after typing, the search hasn't caught up yet.
    expect(search.element().textContent).toBe("Type to search");

    await expect.element(search).toHaveTextContent("Searching for “timer”");
  });
});

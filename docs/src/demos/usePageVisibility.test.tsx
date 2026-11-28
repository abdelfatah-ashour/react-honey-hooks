import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import Demo from "./usePageVisibility";

// A test can't hide its own page, so this covers the visible state: the video plays and its
// watch time counts up. Pausing while hidden is covered by the hook's unit tests.
describe("usePageVisibility demo", () => {
  it("plays and counts the watch time while the page is visible", async () => {
    const screen = await render(<Demo />);
    await expect.element(screen.getByRole("status")).toHaveTextContent("Playing");

    await expect
      .element(screen.getByRole("timer"), { timeout: 3000 })
      .toHaveTextContent("Watched for 1s");
    await expect
      .element(screen.getByRole("timer"), { timeout: 3000 })
      .toHaveTextContent("Watched for 2s");
  });
});

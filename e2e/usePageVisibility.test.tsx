import { usePageVisibility } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

function Probe() {
  return <p>{usePageVisibility() ? "Visible" : "Hidden"}</p>;
}

// A test can't hide its own page, so hiding and showing are covered by the unit tests.
describe("usePageVisibility in a real browser", () => {
  it("reports the page under test as visible", async () => {
    const screen = await render(<Probe />);

    await expect.element(screen.getByText("Visible")).toBeVisible();
  });
});

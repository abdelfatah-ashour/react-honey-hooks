import { useMediaQuery } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

function Layout() {
  const isWide = useMediaQuery("(min-width: 768px)");
  return <p>{isWide ? "Wide layout" : "Narrow layout"}</p>;
}

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("useMediaQuery in a real browser", () => {
  it("follows the viewport as it is resized across the breakpoint", async () => {
    await page.viewport(414, 896);
    const screen = await render(<Layout />);
    await expect.element(screen.getByText("Narrow layout")).toBeVisible();

    await page.viewport(1024, 768);
    await expect.element(screen.getByText("Wide layout")).toBeVisible();

    await page.viewport(767, 768);
    await expect.element(screen.getByText("Narrow layout")).toBeVisible();
  });

  it("treats an invalid query as not matching", async () => {
    function Invalid() {
      return <p>{useMediaQuery("not a (valid query") ? "matches" : "no match"}</p>;
    }
    const screen = await render(<Invalid />);

    await expect.element(screen.getByText("no match")).toBeVisible();
  });
});

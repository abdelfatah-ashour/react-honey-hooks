import { useResponsive } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

function Layout() {
  const { md, lg } = useResponsive();
  return <p>{lg ? "Three columns" : md ? "Two columns" : "One column"}</p>;
}

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("useResponsive in a real browser", () => {
  it("switches layout as the viewport crosses the breakpoints", async () => {
    await page.viewport(414, 896);
    const screen = await render(<Layout />);
    await expect.element(screen.getByText("One column")).toBeVisible();

    await page.viewport(800, 896);
    await expect.element(screen.getByText("Two columns")).toBeVisible();

    await page.viewport(1100, 896);
    await expect.element(screen.getByText("Three columns")).toBeVisible();

    await page.viewport(767, 896);
    await expect.element(screen.getByText("One column")).toBeVisible();
  });
});

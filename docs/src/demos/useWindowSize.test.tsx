import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useWindowSize";

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("useWindowSize demo", () => {
  it("shows the window size and orientation as the window is resized and back", async () => {
    await page.viewport(414, 896);
    const screen = await render(<Demo />);
    const size = screen.getByRole("status");
    await expect.element(size).toHaveTextContent("414 × 896 px");
    await expect.element(screen.getByText("Portrait")).toBeVisible();

    await page.viewport(1024, 768);
    await expect.element(size).toHaveTextContent("1024 × 768 px");
    await expect.element(screen.getByText("Landscape")).toBeVisible();

    await page.viewport(414, 896);
    await expect.element(size).toHaveTextContent("414 × 896 px");
    await expect.element(screen.getByText("Portrait")).toBeVisible();
  });
});

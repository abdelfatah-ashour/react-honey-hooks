import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useMediaQuery";

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("useMediaQuery demo", () => {
  it("switches between the mobile and desktop layouts at the 768px breakpoint", async () => {
    await page.viewport(414, 896);
    const screen = await render(<Demo />);
    const layout = screen.getByRole("status");
    await expect.element(layout).toHaveTextContent("Mobile layout");
    await expect.element(screen.getByRole("button", { name: "Open menu" })).toBeVisible();

    await page.viewport(768, 896);
    await expect.element(layout).toHaveTextContent("Desktop layout");
    await expect.element(screen.getByRole("button", { name: "Pricing" })).toBeVisible();

    await page.viewport(767, 896);
    await expect.element(layout).toHaveTextContent("Mobile layout");
    await expect.element(screen.getByRole("button", { name: "Pricing" })).not.toBeInTheDocument();
  });
});

import { useWindowSize } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

function Size() {
  const { width, height } = useWindowSize();
  return (
    <p>
      Window: {width} × {height}
    </p>
  );
}

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("useWindowSize in a real browser", () => {
  it("follows the viewport as it is resized", async () => {
    await page.viewport(414, 896);
    const screen = await render(<Size />);
    await expect.element(screen.getByText("Window: 414 × 896")).toBeVisible();

    await page.viewport(1024, 768);

    await expect.element(screen.getByText("Window: 1024 × 768")).toBeVisible();
  });
});

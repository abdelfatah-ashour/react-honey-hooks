import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useInterval";

describe("useInterval demo", () => {
  it("counts up once started and holds its time when stopped", async () => {
    const screen = await render(<Demo />);
    const time = screen.getByRole("timer");
    const tenths = () => parseFloat(time.element().textContent) * 10;
    await expect.element(time).toHaveTextContent("0.0 s");

    await userEvent.click(screen.getByRole("button", { name: "Start" }));
    await expect.poll(tenths).toBeGreaterThanOrEqual(3);

    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    const stoppedAt = time.element().textContent;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(time.element().textContent).toBe(stoppedAt);

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await expect.element(time).toHaveTextContent("0.0 s");
  });
});

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useCountdown";

describe("useCountdown demo", () => {
  it("counts a flash sale down to its end and can start it again", async () => {
    const screen = await render(<Demo />);
    const timer = screen.getByRole("timer");
    const text = () => timer.element().textContent;
    const start = screen.getByRole("button", { name: "Start flash sale" });
    await expect.element(timer).toHaveTextContent("No sale running");

    await userEvent.click(start);
    await expect.poll(text).toMatch(/^Ends in [12]s$/);
    await expect.element(timer, { timeout: 5000 }).toHaveTextContent("Sale over");

    await userEvent.click(start);
    await expect.poll(text).toMatch(/^Ends in [12]s$/);
  });
});

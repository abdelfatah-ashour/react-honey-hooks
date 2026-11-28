import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useIdle";

describe("useIdle demo", () => {
  it("asks if you're still there after 3 seconds idle, until the mouse moves or a key is pressed", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    await expect.element(status).toHaveTextContent("Active");

    await expect.element(status, { timeout: 5000 }).toHaveTextContent("Away");
    await expect.element(screen.getByText("Are you still there?")).toBeVisible();
    await userEvent.hover(status);
    await expect.element(status).toHaveTextContent("Active");
    await expect.element(screen.getByText("Are you still there?")).not.toBeInTheDocument();

    await expect.element(status, { timeout: 5000 }).toHaveTextContent("Away");
    await userEvent.keyboard("{Shift}");
    await expect.element(status).toHaveTextContent("Active");
  });
});

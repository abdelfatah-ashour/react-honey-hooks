import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useDebouncedEffect";

describe("useDebouncedEffect demo", () => {
  it("checks the username only once typing pauses", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    await expect.element(status).toHaveTextContent("Pick a username");

    await userEvent.type(screen.getByRole("textbox", { name: "Username" }), "sam");
    // Straight after typing, the check is still waiting for a pause.
    expect(status.element().textContent).toBe("Waiting for you to stop typing…");

    await expect.element(status).toHaveTextContent("@sam is available");
  });

  it("reports a taken username", async () => {
    const screen = await render(<Demo />);

    await userEvent.type(screen.getByRole("textbox", { name: "Username" }), "admin");

    await expect.element(screen.getByRole("status")).toHaveTextContent("@admin is taken");
  });
});

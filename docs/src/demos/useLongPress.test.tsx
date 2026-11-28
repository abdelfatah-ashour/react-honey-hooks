import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useLongPress";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("useLongPress demo", () => {
  it("deletes the draft when the button is held down", async () => {
    const screen = await render(<Demo />);
    await userEvent.hover(screen.getByRole("button", { name: "Hold to delete" }));

    await commands.mouseDown();
    await expect.element(screen.getByRole("status")).toHaveTextContent("Draft deleted.");
    await commands.mouseUp();

    // Releasing after the long press doesn't also click anything.
    await pause(100);
    await expect.element(screen.getByRole("status")).toHaveTextContent("Draft deleted.");
  });

  it("only asks you to keep holding when the button is released too soon", async () => {
    const screen = await render(<Demo />);

    await userEvent.click(screen.getByRole("button", { name: "Hold to delete" }));
    await expect.element(screen.getByRole("status")).toHaveTextContent("Keep holding to delete.");

    // Longer than the hold delay: the cancelled press never fires.
    await pause(800);
    await expect.element(screen.getByRole("status")).toHaveTextContent("Keep holding to delete.");
  });
});

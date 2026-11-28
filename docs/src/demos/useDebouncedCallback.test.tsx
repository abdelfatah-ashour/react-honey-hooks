import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useDebouncedCallback";

describe("useDebouncedCallback demo", () => {
  it("autosaves the note once typing pauses", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    await expect.element(status).toHaveTextContent("All changes saved");

    await userEvent.type(screen.getByRole("textbox", { name: "Note" }), "Buy milk");
    // Straight after typing, the save is still waiting for a pause.
    expect(status.element().textContent).toBe("Unsaved changes");

    await expect.element(status, { timeout: 3000 }).toHaveTextContent("All changes saved");
  });

  it("saves straight away with Save now", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");

    await userEvent.type(screen.getByRole("textbox", { name: "Note" }), "Call Sam");
    await userEvent.click(screen.getByRole("button", { name: "Save now" }));

    expect(status.element().textContent).toBe("All changes saved");
  });
});

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useDynamicList";

describe("useDynamicList demo", () => {
  it("adds, fills in and removes guest rows down to an empty list", async () => {
    const screen = await render(<Demo />);
    const count = screen.getByRole("status");
    await expect.element(screen.getByRole("textbox", { name: "Guest 1" })).toHaveValue("Ada");
    await expect.element(count).toHaveTextContent("1 guest");

    await userEvent.click(screen.getByRole("button", { name: "Add guest" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Guest 2" }), "Grace");
    await expect.element(count).toHaveTextContent("2 guests");

    await userEvent.click(screen.getByRole("button", { name: "Remove guest 1" }));
    await expect.element(screen.getByRole("textbox", { name: "Guest 1" })).toHaveValue("Grace");
    await expect.element(screen.getByRole("textbox", { name: "Guest 2" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove guest 1" }));
    await expect.element(count).toHaveTextContent("No guests yet");
  });
});

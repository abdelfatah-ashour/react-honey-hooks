import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useMouse";

describe("useMouse demo", () => {
  it("lights the card up under the pointer and turns it off when the pointer leaves", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    const card = screen.getByRole("group", { name: "Spotlight card" });

    await userEvent.hover(card);
    await expect.element(status).toHaveTextContent("Spotlight on");

    await userEvent.hover(screen.getByText("Move your mouse over the card."));
    await expect.element(status).toHaveTextContent("Spotlight off");
  });
});

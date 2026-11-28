import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useAsync";

describe("useAsync demo", () => {
  it("shows loading, then the weather for a known city", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    await expect.element(status).toHaveTextContent("Enter a city to look up");

    await userEvent.type(screen.getByRole("textbox", { name: "City" }), "Cairo");
    await userEvent.click(screen.getByRole("button", { name: "Look up" }));

    await expect.element(status).toHaveTextContent("Loading…");
    await expect.element(status).toHaveTextContent("Cairo: 24°C and sunny");
  });

  it("shows the error for a city it can't find", async () => {
    const screen = await render(<Demo />);

    await userEvent.type(screen.getByRole("textbox", { name: "City" }), "Atlantis");
    await userEvent.click(screen.getByRole("button", { name: "Look up" }));

    await expect.element(screen.getByRole("status")).toHaveTextContent("No weather for Atlantis");
  });
});

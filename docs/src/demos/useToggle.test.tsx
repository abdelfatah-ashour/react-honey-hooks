import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useToggle";

describe("useToggle demo", () => {
  it("opens the answer with the question and closes it with the close button", async () => {
    const screen = await render(<Demo />);
    const question = screen.getByRole("button", { name: "Do you ship abroad?" });
    await expect.element(question).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(question);
    await expect.element(screen.getByText("Yes, to over 40 countries.")).toBeVisible();
    await expect.element(question).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await expect.element(screen.getByText("Yes, to over 40 countries.")).not.toBeInTheDocument();
    await expect.element(question).toHaveAttribute("aria-expanded", "false");
  });
});

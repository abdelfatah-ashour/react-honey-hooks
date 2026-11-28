import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useTextSelection";

const SENTENCE = "A bee visits about two million flowers to make one jar of honey.";

describe("useTextSelection demo", () => {
  it("offers to quote text selected in the article, and quotes it", async () => {
    const screen = await render(<Demo />);

    await userEvent.tripleClick(screen.getByText(SENTENCE));
    await userEvent.click(screen.getByRole("button", { name: "Quote" }));

    await expect.element(screen.getByRole("status")).toHaveTextContent(`“${SENTENCE}”`);
  });

  it("offers nothing for a selection outside the article", async () => {
    const screen = await render(<Demo />);
    await userEvent.tripleClick(screen.getByText(SENTENCE));
    await expect.element(screen.getByRole("button", { name: "Quote" })).toBeVisible();

    await userEvent.tripleClick(screen.getByText("Select a sentence below to quote it."));
    await expect.element(screen.getByRole("button", { name: "Quote" })).not.toBeInTheDocument();
  });
});

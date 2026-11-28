import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useTimeout";

describe("useTimeout demo", () => {
  it("shows a toast on save that hides itself, and shows it again on the next save", async () => {
    const screen = await render(<Demo />);
    const save = screen.getByRole("button", { name: "Save" });
    await expect.element(screen.getByRole("status")).not.toBeInTheDocument();

    await userEvent.click(save);
    await expect.element(screen.getByRole("status")).toHaveTextContent("Changes saved");
    await expect.element(screen.getByRole("status"), { timeout: 3000 }).not.toBeInTheDocument();

    await userEvent.click(save);
    await expect.element(screen.getByRole("status")).toHaveTextContent("Changes saved");
  });
});

import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useOnlineStatus";

describe("useOnlineStatus demo", () => {
  it("shows an offline banner and disables saving while offline, until back online", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    const save = screen.getByRole("button", { name: "Save" });
    await expect.element(status).toHaveTextContent("Online");
    await expect.element(save).toBeEnabled();

    void commands.goOfflineFor(1500);
    await expect.element(status).toHaveTextContent("Offline");
    await expect.element(screen.getByRole("alert")).toBeVisible();
    await expect.element(save).toBeDisabled();

    await expect.element(status, { timeout: 5000 }).toHaveTextContent("Online");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    await expect.element(save).toBeEnabled();
  });
});

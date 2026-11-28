import { beforeAll, describe, expect, it } from "vitest";
import { commands, server, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useCopyToClipboard";

// Headless Chromium refuses clipboard writes unless granted, unlike a real Chrome tab after a
// click. Only Chromium knows these permissions; asking another browser breaks its later grants.
let canRead = false;
beforeAll(async () => {
  if (server.browser !== "chromium") return;
  canRead =
    (await commands.grantPermission("clipboard-read")) &&
    (await commands.grantPermission("clipboard-write"));
});

describe("useCopyToClipboard demo", () => {
  it("copies the coupon code and shows Copied! until it resets", async () => {
    const screen = await render(<Demo />);

    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await expect.element(screen.getByRole("button", { name: "Copied!" })).toBeVisible();
    if (canRead) expect(await navigator.clipboard.readText()).toBe("HONEY20");

    await expect
      .element(screen.getByRole("button", { name: "Copy code" }), { timeout: 3000 })
      .toBeVisible();
    expect(screen.getByRole("alert").query()).toBeNull();
  });
});

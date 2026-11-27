import { usePermission } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands, server } from "vitest/browser";
import { render } from "vitest-browser-react";

function Permission({ name }: { name: string }) {
  return <p>Permission: {usePermission(name)}</p>;
}

describe("usePermission in a real browser", () => {
  it("settles on the browser's answer for a real permission", async () => {
    const screen = await render(<Permission name="geolocation" />);

    await expect.element(screen.getByText(/^Permission: (granted|denied|prompt)$/)).toBeVisible();
  });

  // Runs before the next test grants geolocation, which lasts for the rest of the run. WebKit
  // fires no `change` event for a permission Playwright grants, so it is skipped there.
  it.skipIf(server.browser === "webkit")(
    "follows the permission being granted while it is shown",
    async () => {
      const screen = await render(<Permission name="geolocation" />);
      await expect.element(screen.getByText(/^Permission: (denied|prompt)$/)).toBeVisible();

      expect(await commands.grantPermission("geolocation")).toBe(true);

      await expect.element(screen.getByText("Permission: granted")).toBeVisible();
    },
  );

  it("reports a granted permission as granted", async () => {
    expect(await commands.grantPermission("geolocation")).toBe(true);

    const screen = await render(<Permission name="geolocation" />);

    await expect.element(screen.getByText("Permission: granted")).toBeVisible();
  });

  it("is unsupported for a name the browser doesn't know", async () => {
    const screen = await render(<Permission name="not-a-permission" />);

    await expect.element(screen.getByText("Permission: unsupported")).toBeVisible();
  });
});

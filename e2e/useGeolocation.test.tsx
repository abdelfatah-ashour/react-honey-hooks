import { useGeolocation } from "react-honey-hooks";
import { beforeAll, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";

function Location({ watch = false }: { watch?: boolean }) {
  const { status, position } = useGeolocation({ watch });
  return (
    <p>
      {status}
      {position && `: ${String(position.coords.latitude)}, ${String(position.coords.longitude)}`}
    </p>
  );
}

beforeAll(async () => {
  expect(await commands.grantPermission("geolocation")).toBe(true);
});

describe("useGeolocation in a real browser", () => {
  it("gets the browser's position", async () => {
    await commands.setGeolocation(30.05, 31.25);

    const screen = await render(<Location />);

    await expect.element(screen.getByText("success: 30.05, 31.25")).toBeVisible();
  });

  it("with watch, follows the position as it changes", async () => {
    await commands.setGeolocation(51.5, -0.12);
    const screen = await render(<Location watch />);
    await expect.element(screen.getByText("success: 51.5, -0.12")).toBeVisible();

    await commands.setGeolocation(48.85, 2.35);

    await expect.element(screen.getByText("success: 48.85, 2.35")).toBeVisible();
  });
});

import { useIdle } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Presence() {
  const idle = useIdle(300);
  return (
    <>
      <p>{idle ? "Away" : "Online"}</p>
      <input aria-label="Message" />
    </>
  );
}

describe("useIdle in a real browser", () => {
  it("goes idle with no activity, and comes back on a key press or pointer movement", async () => {
    const screen = await render(<Presence />);
    await expect.element(screen.getByText("Online")).toBeVisible();
    await expect.element(screen.getByText("Away")).toBeVisible();

    await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "hi");
    await expect.element(screen.getByText("Online")).toBeVisible();
    await expect.element(screen.getByText("Away")).toBeVisible();

    await userEvent.hover(screen.getByText("Away"));
    await expect.element(screen.getByText("Online")).toBeVisible();
  });
});

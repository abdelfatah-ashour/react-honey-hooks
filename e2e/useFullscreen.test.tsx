import { useRef } from "react";
import { useFullscreen } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Player() {
  const ref = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(ref);
  return (
    <div ref={ref} data-testid="player">
      <button type="button" onClick={() => void toggle()}>
        {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>
    </div>
  );
}

afterEach(async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
});

describe("useFullscreen in a real browser", () => {
  it("shows the player fullscreen on a click, and leaves on another", async () => {
    const screen = await render(<Player />);

    await userEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
    await expect.element(screen.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
    expect(document.fullscreenElement).toBe(screen.getByTestId("player").element());

    await userEvent.click(screen.getByRole("button", { name: "Exit fullscreen" }));
    await expect.element(screen.getByRole("button", { name: "Fullscreen" })).toBeVisible();
    expect(document.fullscreenElement).toBeNull();
  });
});

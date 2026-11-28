import { useRef } from "react";
import { useScroll } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Log() {
  const box = useRef<HTMLDivElement>(null);
  const { y } = useScroll(box);
  return (
    <>
      <div ref={box} data-testid="log" style={{ height: 100, overflow: "auto" }}>
        <div style={{ height: 1000 }}>Lines</div>
      </div>
      <p>{y > 0 ? "Scrolled" : "At the top"}</p>
    </>
  );
}

describe("useScroll in a real browser", () => {
  it("follows a scrollable box as the mouse wheel scrolls it", async () => {
    const screen = await render(<Log />);
    await expect.element(screen.getByText("At the top")).toBeVisible();

    await userEvent.hover(screen.getByTestId("log"));
    await commands.wheel(300);
    await expect.element(screen.getByText("Scrolled")).toBeVisible();

    screen.getByTestId("log").element().scrollTop = 0;
    await expect.element(screen.getByText("At the top")).toBeVisible();
  });
});

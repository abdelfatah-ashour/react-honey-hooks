import { useRef } from "react";
import { useHover } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Card() {
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useHover(ref);
  return (
    <>
      <div ref={ref} style={{ padding: 20 }}>
        <span>Card title</span>
      </div>
      <p>{hovered ? "Hovered" : "Not hovered"}</p>
      <p style={{ marginTop: 100 }}>Elsewhere</p>
    </>
  );
}

describe("useHover in a real browser", () => {
  it("follows the pointer onto the element, onto its child, and away", async () => {
    const screen = await render(<Card />);
    // The real mouse may already rest where the card renders, so start from a known place.
    await userEvent.hover(screen.getByText("Elsewhere"));
    await expect.element(screen.getByText("Not hovered")).toBeVisible();

    await userEvent.hover(screen.getByText("Card title"));
    await expect.element(screen.getByText("Hovered", { exact: true })).toBeVisible();

    await userEvent.hover(screen.getByText("Elsewhere"));
    await expect.element(screen.getByText("Not hovered")).toBeVisible();
  });
});

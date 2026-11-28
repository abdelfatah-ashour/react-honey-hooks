import { useRef } from "react";
import { useMouse } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Spotlight() {
  const area = useRef<HTMLDivElement>(null);
  const mouse = useMouse(area);
  const inside =
    mouse?.element &&
    mouse.element.x >= 0 &&
    mouse.element.y >= 0 &&
    mouse.element.x <= mouse.element.width &&
    mouse.element.y <= mouse.element.height;
  return (
    <>
      <div ref={area} data-testid="area" style={{ width: 200, height: 100, margin: 50 }} />
      <button type="button">Elsewhere</button>
      <p>{mouse === null ? "No mouse yet" : inside ? "Inside" : "Outside"}</p>
      <p data-testid="size">
        {mouse?.element ? `${String(mouse.element.width)}x${String(mouse.element.height)}` : ""}
      </p>
    </>
  );
}

describe("useMouse in a real browser", () => {
  it("tracks the real pointer relative to an element", async () => {
    const screen = await render(<Spotlight />);

    await userEvent.hover(screen.getByTestId("area"));
    await expect.element(screen.getByText("Inside")).toBeVisible();
    await expect.element(screen.getByTestId("size")).toHaveTextContent("200x100");

    await userEvent.hover(screen.getByRole("button", { name: "Elsewhere" }));
    await expect.element(screen.getByText("Outside")).toBeVisible();
  });
});

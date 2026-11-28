import { useWindowScroll } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Page() {
  const { y } = useWindowScroll();
  return (
    <>
      <p style={{ position: "fixed", top: 0 }} data-testid="position">
        Scrolled {y}px
      </p>
      <div style={{ height: "400vh" }} />
    </>
  );
}

afterEach(() => {
  window.scrollTo(0, 0);
});

describe("useWindowScroll in a real browser", () => {
  it("follows the page as the wheel scrolls it, and back to the top", async () => {
    const screen = await render(<Page />);
    const position = screen.getByTestId("position");
    await expect.element(position).toHaveTextContent("Scrolled 0px");

    // Hover first: in WebKit, a wheel with no earlier pointer move doesn't scroll.
    await userEvent.hover(position);
    await commands.wheel(600);
    await expect.poll(() => window.scrollY).toBeGreaterThan(0);
    // Compared live, as smooth scrolling may still be moving when the text first updates.
    await expect
      .poll(() => position.element().textContent === `Scrolled ${String(window.scrollY)}px`)
      .toBe(true);

    window.scrollTo(0, 0);
    await expect.element(position).toHaveTextContent("Scrolled 0px");
  });
});

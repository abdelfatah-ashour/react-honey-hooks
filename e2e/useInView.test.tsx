import { useRef } from "react";
import { useInView } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

function Page({ once = false }: { once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once });

  return (
    <>
      <p style={{ position: "fixed", top: 0 }}>
        {inView ? "Target in view" : "Target out of view"}
      </p>
      <div style={{ height: "300vh" }} />
      <div ref={ref} data-testid="target" style={{ height: 50 }} />
      <div style={{ height: "300vh" }} />
    </>
  );
}

afterEach(() => {
  window.scrollTo(0, 0);
});

describe("useInView in a real browser", () => {
  it("follows the target as the page scrolls to it and away again", async () => {
    const screen = await render(<Page />);
    await expect.element(screen.getByText("Target out of view")).toBeInTheDocument();

    screen.getByTestId("target").element().scrollIntoView();
    await expect.element(screen.getByText("Target in view")).toBeInTheDocument();

    window.scrollTo(0, 0);
    await expect.element(screen.getByText("Target out of view")).toBeInTheDocument();
  });

  it("with once, stays in view after scrolling away", async () => {
    const screen = await render(<Page once />);

    screen.getByTestId("target").element().scrollIntoView();
    await expect.element(screen.getByText("Target in view")).toBeInTheDocument();

    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect.element(screen.getByText("Target in view")).toBeInTheDocument();
  });
});

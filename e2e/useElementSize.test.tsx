import { useRef, useState } from "react";
import { useElementSize } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

interface BoxProps {
  box?: "content-box" | "border-box";
  vertical?: boolean;
}

function Box({ box, vertical = false }: BoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const { width, height } = useElementSize(ref, box ? { box } : {});

  return (
    <>
      <div
        ref={ref}
        style={{
          width: wide ? 300 : 120,
          height: 40,
          padding: 10,
          border: "1px solid",
          writingMode: vertical ? "vertical-rl" : "horizontal-tb",
        }}
      />
      <p>
        Size: {width} × {height}
      </p>
      <button
        type="button"
        onClick={() => {
          setWide(true);
        }}
      >
        Widen
      </button>
    </>
  );
}

describe("useElementSize in a real browser", () => {
  it("measures the content box and follows a resize", async () => {
    const screen = await render(<Box />);
    await expect.element(screen.getByText("Size: 120 × 40")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Widen" }));

    await expect.element(screen.getByText("Size: 300 × 40")).toBeVisible();
  });

  it("with box: border-box, includes padding and border", async () => {
    const screen = await render(<Box box="border-box" />);

    await expect.element(screen.getByText("Size: 142 × 62")).toBeVisible();
  });

  it("with box: border-box, reports width and height for vertical text", async () => {
    const screen = await render(<Box box="border-box" vertical />);

    await expect.element(screen.getByText("Size: 142 × 62")).toBeVisible();
  });
});

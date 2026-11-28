import { useState } from "react";
import { type ControllableValueProps, useControllableValue } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Rating({ label, ...props }: ControllableValueProps<number> & { label: string }) {
  const [stars = 0, setStars] = useControllableValue(props);
  return (
    <fieldset aria-label={label}>
      {[1, 2, 3].map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={value <= stars}
          onClick={() => {
            setStars(value);
          }}
        >
          {value} stars
        </button>
      ))}
      <output>{stars}</output>
    </fieldset>
  );
}

function Review() {
  const [stars, setStars] = useState(1);
  return (
    <>
      <Rating label="Uncontrolled" />
      <Rating
        label="Controlled"
        value={stars}
        onChange={(next) => {
          setStars(Math.min(next, 2));
        }}
      />
    </>
  );
}

describe("useControllableValue in a real browser", () => {
  it("keeps its own value when uncontrolled and follows the parent when controlled", async () => {
    const screen = await render(<Review />);
    const uncontrolled = screen.getByRole("group", { name: "Uncontrolled" });
    const controlled = screen.getByRole("group", { name: "Controlled" });

    await userEvent.click(uncontrolled.getByRole("button", { name: "3 stars" }));
    await expect.element(uncontrolled.getByRole("status")).toHaveTextContent("3");

    await expect.element(controlled.getByRole("status")).toHaveTextContent("1");
    await userEvent.click(controlled.getByRole("button", { name: "3 stars" }));
    await expect.element(controlled.getByRole("status")).toHaveTextContent("2");
  });
});

import { useUndoState } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function ColorPicker() {
  const [color, setColor, { undo, redo, canUndo, canRedo }] = useUndoState("red");
  return (
    <>
      <p>Color: {color}</p>
      {["green", "blue"].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => {
            setColor(option);
          }}
        >
          Pick {option}
        </button>
      ))}
      <button type="button" onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </>
  );
}

describe("useUndoState in a real browser", () => {
  it("undoes and redoes choices, enabling the buttons only when there is a step", async () => {
    const screen = await render(<ColorPicker />);
    const undo = screen.getByRole("button", { name: "Undo" });
    const redo = screen.getByRole("button", { name: "Redo" });
    await expect.element(undo).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Pick green" }));
    await userEvent.click(screen.getByRole("button", { name: "Pick blue" }));
    await userEvent.click(undo);
    await expect.element(screen.getByText("Color: green")).toBeVisible();
    await userEvent.click(undo);
    await expect.element(screen.getByText("Color: red")).toBeVisible();
    await expect.element(undo).toBeDisabled();

    await userEvent.click(redo);
    await expect.element(screen.getByText("Color: green")).toBeVisible();
  });
});

import { useState } from "react";
import { useThrottledValue } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Preview() {
  const [text, setText] = useState("");
  const preview = useThrottledValue(text, 200);
  return (
    <>
      <input
        aria-label="Text"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <output aria-label="Preview">{preview}</output>
    </>
  );
}

describe("useThrottledValue in a real browser", () => {
  it("shows the first keystroke at once and catches up with fast typing", async () => {
    const screen = await render(<Preview />);
    const preview = screen.getByLabelText("Preview");

    await userEvent.type(screen.getByLabelText("Text"), "h");
    await expect.element(preview).toHaveTextContent("h");

    await userEvent.type(screen.getByLabelText("Text"), "oney");
    await expect.element(preview).toHaveTextContent("honey");
  });
});

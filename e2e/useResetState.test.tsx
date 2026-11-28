import { useResetState } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Note() {
  const [text, setText, reset] = useResetState("Buy milk");
  return (
    <>
      <textarea
        aria-label="Note"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <button type="button" onClick={reset}>
        Discard changes
      </button>
    </>
  );
}

describe("useResetState in a real browser", () => {
  it("discards typed changes and goes back to the initial text", async () => {
    const screen = await render(<Note />);
    const note = screen.getByLabelText("Note");

    await userEvent.fill(note, "Buy eggs");
    await expect.element(note).toHaveValue("Buy eggs");

    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    await expect.element(note).toHaveValue("Buy milk");
  });
});

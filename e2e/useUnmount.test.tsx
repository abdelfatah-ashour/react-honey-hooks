import { useState } from "react";
import { useUnmount } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Editor({ onClose }: { onClose: (text: string) => void }) {
  const [text, setText] = useState("");
  useUnmount(() => {
    onClose(text);
  });
  return (
    <textarea
      aria-label="Editor"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
      }}
    />
  );
}

function App({ onClose }: { onClose: (text: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
        }}
      >
        Close editor
      </button>
      {open && <Editor onClose={onClose} />}
    </>
  );
}

describe("useUnmount in a real browser", () => {
  it("saves the latest text once when the editor closes", async () => {
    const saved: string[] = [];
    const onClose = (text: string) => {
      saved.push(text);
    };
    const screen = await render(<App onClose={onClose} />);

    await userEvent.type(screen.getByLabelText("Editor"), "Draft");
    expect(saved).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Close editor" }));
    await expect.element(screen.getByLabelText("Editor")).not.toBeInTheDocument();
    expect(saved).toEqual(["Draft"]);
  });
});

import { useRef, useState } from "react";
import { useFocusTrap } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  return (
    <div ref={ref} role="dialog" aria-label="Rename">
      <input aria-label="Name" />
      <button type="button" style={{ display: "none" }}>
        Hidden
      </button>
      <button type="button" onClick={onClose}>
        Done
      </button>
    </div>
  );
}

function Page() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Rename file
      </button>
      <a href="#behind">A link behind the dialog</a>
      {open && (
        <Dialog
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

describe("useFocusTrap in a real browser", () => {
  it("keeps Tab inside the open dialog, then returns focus to the opener", async () => {
    const screen = await render(<Page />);
    const opener = screen.getByRole("button", { name: "Rename file" });
    const name = screen.getByRole("textbox", { name: "Name" });
    const done = screen.getByRole("button", { name: "Done" });

    // Opened from the keyboard: Safari doesn't focus a button that is clicked, so after a click
    // there would be no earlier focus to return to.
    opener.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(name).toHaveFocus();

    await userEvent.tab();
    await expect.element(done).toHaveFocus();
    await userEvent.tab();
    await expect.element(name).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(done).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect.element(opener).toHaveFocus();
  });
});

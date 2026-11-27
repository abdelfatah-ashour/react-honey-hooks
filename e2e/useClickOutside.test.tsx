import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "react-honey-hooks";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Menu({ enabled = true, onOutside }: { enabled?: boolean; onOutside?: () => void }) {
  const [open, setOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    [menuRef, popoverRef],
    () => {
      setOpen(false);
      onOutside?.();
    },
    { enabled },
  );

  return (
    <>
      <div ref={menuRef}>
        <button type="button">Toggle</button>
        {open && <p>Menu is open</p>}
      </div>
      {createPortal(
        <div ref={popoverRef}>
          <button type="button">In popover</button>
        </div>,
        document.body,
      )}
      <button type="button">Elsewhere</button>
    </>
  );
}

describe("useClickOutside in a real browser", () => {
  it("closes on a real click outside and stays open on clicks inside", async () => {
    const screen = await render(<Menu />);

    await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await expect.element(screen.getByText("Menu is open")).toBeVisible();

    await userEvent.click(page.getByRole("button", { name: "Elsewhere" }));
    await expect.element(screen.getByText("Menu is open")).not.toBeInTheDocument();
  });

  it("treats a portalled element passed as a second ref as inside", async () => {
    const screen = await render(<Menu />);

    await userEvent.click(page.getByRole("button", { name: "In popover" }));

    await expect.element(screen.getByText("Menu is open")).toBeVisible();
  });

  it("ignores outside clicks while disabled", async () => {
    const onOutside = vi.fn();
    const screen = await render(<Menu enabled={false} onOutside={onOutside} />);

    await userEvent.click(page.getByRole("button", { name: "Elsewhere" }));

    await expect.element(screen.getByText("Menu is open")).toBeVisible();
    expect(onOutside).not.toHaveBeenCalled();
  });

  it("stops listening after unmount", async () => {
    const onOutside = vi.fn();
    const screen = await render(<Menu onOutside={onOutside} />);
    await screen.unmount();

    await userEvent.click(page.elementLocator(document.body));

    expect(onOutside).not.toHaveBeenCalled();
  });
});

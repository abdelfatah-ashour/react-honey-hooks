import { useToggle } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Faq() {
  const [open, { toggle, setFalse }] = useToggle();

  return (
    <>
      <button aria-expanded={open} onClick={toggle}>
        Shipping
      </button>
      {open && (
        <div>
          <p>Orders ship in two days.</p>
          <button onClick={setFalse}>Close</button>
        </div>
      )}
    </>
  );
}

describe("useToggle in a real browser", () => {
  it("opens and closes a disclosure with a click and a close button", async () => {
    const screen = await render(<Faq />);
    const trigger = screen.getByRole("button", { name: "Shipping" });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await expect.element(screen.getByText("Orders ship in two days.")).toBeVisible();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);
    await expect.element(screen.getByText("Orders ship in two days.")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

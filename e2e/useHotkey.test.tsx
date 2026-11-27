import { useState } from "react";
import { useHotkey } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Shortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [saves, setSaves] = useState(0);

  useHotkey("?", () => {
    setHelpOpen(true);
  });
  useHotkey(
    "Escape",
    () => {
      setHelpOpen(false);
    },
    { enabled: helpOpen },
  );
  useHotkey("ctrl+s", (event) => {
    event.preventDefault();
    setSaves((s) => s + 1);
  });

  return (
    <>
      <input aria-label="Notes" />
      <p>{helpOpen ? "Help is open" : "Help is closed"}</p>
      <p>Saves: {saves}</p>
    </>
  );
}

describe("useHotkey in a real browser", () => {
  it("opens help on ?, closes it on Escape, and saves on Ctrl+S", async () => {
    const screen = await render(<Shortcuts />);

    await userEvent.keyboard("?");
    await expect.element(screen.getByText("Help is open")).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByText("Help is closed")).toBeVisible();

    await userEvent.keyboard("{Control>}s{/Control}");
    await expect.element(screen.getByText("Saves: 1")).toBeVisible();
    await userEvent.keyboard("{Control>}{Shift>}s{/Shift}{/Control}");
    await expect.element(screen.getByText("Saves: 1")).toBeVisible();
  });

  it("ignores the shortcut while typing in a field", async () => {
    const screen = await render(<Shortcuts />);
    const notes = screen.getByRole("textbox", { name: "Notes" });

    await userEvent.type(notes, "why?");

    await expect.element(notes).toHaveValue("why?");
    await expect.element(screen.getByText("Help is closed")).toBeVisible();
  });
});

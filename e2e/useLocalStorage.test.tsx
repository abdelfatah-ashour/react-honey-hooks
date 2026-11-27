import { useLocalStorage } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function ThemeToggle() {
  const [theme, setTheme, resetTheme] = useLocalStorage<"light" | "dark">("theme", "light");
  return (
    <>
      <p>Theme: {theme}</p>
      <button
        type="button"
        onClick={() => {
          setTheme((t) => (t === "light" ? "dark" : "light"));
        }}
      >
        Toggle
      </button>
      <button type="button" onClick={resetTheme}>
        Reset
      </button>
    </>
  );
}

const frames: HTMLIFrameElement[] = [];

/** A same-origin frame shares this page's storage, so its writes reach us as `storage` events. */
function otherDocument(): Window {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  frames.push(frame);
  const other = frame.contentWindow;
  if (!other) throw new Error("iframe has no window");
  return other;
}

afterEach(() => {
  localStorage.clear();
  for (const frame of frames.splice(0)) frame.remove();
});

describe("useLocalStorage in a real browser", () => {
  it("stores a choice that is still there after remounting, until it is reset", async () => {
    const first = await render(<ThemeToggle />);
    await userEvent.click(first.getByRole("button", { name: "Toggle" }));
    await expect.element(first.getByText("Theme: dark")).toBeVisible();
    await first.unmount();

    const second = await render(<ThemeToggle />);
    await expect.element(second.getByText("Theme: dark")).toBeVisible();

    await userEvent.click(second.getByRole("button", { name: "Reset" }));
    await expect.element(second.getByText("Theme: light")).toBeVisible();
    expect(localStorage.getItem("theme")).toBeNull();
  });

  it("follows a change written by another document", async () => {
    const screen = await render(<ThemeToggle />);
    const other = otherDocument();

    other.localStorage.setItem("theme", JSON.stringify("dark"));

    await expect.element(screen.getByText("Theme: dark")).toBeVisible();
  });
});

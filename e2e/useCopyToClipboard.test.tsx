import { useCopyToClipboard } from "react-honey-hooks";
import { beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function CopyButton({ text }: { text: string }) {
  const { copy, copied, error } = useCopyToClipboard(300);
  return (
    <>
      <button type="button" onClick={() => void copy(text)}>
        {copied ? "Copied!" : "Copy"}
      </button>
      {error && <p role="alert">{error.message}</p>}
    </>
  );
}

// Headless Chromium refuses clipboard writes unless granted, unlike a real Chrome tab after a
// click. Refused writes are covered by the unit tests.
let canRead = false;
beforeAll(async () => {
  canRead = await commands.grantClipboardRead();
});

describe("useCopyToClipboard in a real browser", () => {
  it("shows Copied! after a real click, then resets", async () => {
    const screen = await render(<CopyButton text="npm install react-honey-hooks" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await expect.element(screen.getByRole("button", { name: "Copied!" })).toBeVisible();

    await expect.element(screen.getByRole("button", { name: "Copy" })).toBeVisible();
    expect(screen.getByRole("alert").query()).toBeNull();
  });

  it("puts the text on the clipboard, where the browser lets the test read it back", async () => {
    const screen = await render(<CopyButton text="honey" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await expect.element(screen.getByRole("button", { name: "Copied!" })).toBeVisible();

    if (canRead) expect(await navigator.clipboard.readText()).toBe("honey");
  });
});

import { useState } from "react";
import { useDocumentTitle } from "react-honey-hooks";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Inbox() {
  const [unread, setUnread] = useState(1);
  useDocumentTitle(`Inbox (${String(unread)})`, { restoreOnUnmount: true });
  return (
    <button
      type="button"
      onClick={() => {
        setUnread((count) => count + 1);
      }}
    >
      New message
    </button>
  );
}

let originalTitle: string;

beforeEach(() => {
  originalTitle = document.title;
  document.title = "Home";
});

afterEach(() => {
  document.title = originalTitle;
});

describe("useDocumentTitle in a real browser", () => {
  it("sets the title, follows updates, and restores the old title on unmount", async () => {
    const screen = await render(<Inbox />);
    await expect.poll(() => document.title).toBe("Inbox (1)");

    await userEvent.click(screen.getByRole("button", { name: "New message" }));
    await expect.poll(() => document.title).toBe("Inbox (2)");

    await screen.unmount();
    expect(document.title).toBe("Home");
  });
});

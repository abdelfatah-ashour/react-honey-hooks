import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useDocumentTitle";

let originalTitle: string;

beforeEach(() => {
  originalTitle = document.title;
  document.title = "Docs page";
});

afterEach(() => {
  document.title = originalTitle;
});

describe("useDocumentTitle demo", () => {
  it("shows the unread count in the tab title while switched on, then restores the page's title", async () => {
    const screen = await render(<Demo />);
    const toggle = screen.getByRole("button", { name: "Show in tab title" });
    await expect.element(screen.getByRole("status")).toHaveTextContent("2 unread");
    expect(document.title).toBe("Docs page");

    await userEvent.click(toggle);
    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => document.title).toBe("(2) Inbox");

    await userEvent.click(screen.getByRole("button", { name: "New message" }));
    await expect.element(screen.getByRole("status")).toHaveTextContent("3 unread");
    await expect.poll(() => document.title).toBe("(3) Inbox");

    await userEvent.click(toggle);
    await expect.poll(() => document.title).toBe("Docs page");
  });
});

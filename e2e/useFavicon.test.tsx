import { useState } from "react";
import { useFavicon } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

const DOT =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg"><circle r="8" cx="8" cy="8" fill="red"/></svg>',
  );

function Inbox() {
  const [unread, setUnread] = useState(0);
  useFavicon(unread > 0 ? DOT : null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setUnread((count) => count + 1);
        }}
      >
        New message
      </button>
      <button
        type="button"
        onClick={() => {
          setUnread(0);
        }}
      >
        Mark all read
      </button>
    </>
  );
}

function iconHrefs(): (string | null)[] {
  return [...document.head.querySelectorAll('link[rel~="icon"]')].map((link) =>
    link.getAttribute("href"),
  );
}

afterEach(() => {
  for (const link of document.head.querySelectorAll('link[data-test="icon"]')) link.remove();
});

describe("useFavicon in a real browser", () => {
  it("shows an unread dot as the tab icon, then puts the page's icon back", async () => {
    const own = document.createElement("link");
    own.rel = "icon";
    own.href = "/favicon.ico";
    own.dataset.test = "icon";
    document.head.append(own);
    const before = iconHrefs();
    expect(before).toContain("/favicon.ico");
    const screen = await render(<Inbox />);

    await userEvent.click(screen.getByRole("button", { name: "New message" }));
    await expect.poll(iconHrefs).toEqual(before.map(() => DOT));

    await userEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    await expect.poll(iconHrefs).toEqual(before);
  });
});

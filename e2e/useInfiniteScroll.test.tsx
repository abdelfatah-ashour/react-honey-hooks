import { useRef } from "react";
import { useInfiniteScroll } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

/** Five pages of twenty posts each, arriving after a short delay. */
function loadPosts(cursor: number | undefined) {
  const page = cursor ?? 0;
  return new Promise<{ items: string[]; next: number | undefined }>((resolve) => {
    setTimeout(() => {
      resolve({
        items: Array.from({ length: 20 }, (_, index) => `Post ${String(page * 20 + index + 1)}`),
        next: page < 4 ? page + 1 : undefined,
      });
    }, 30);
  });
}

function Feed() {
  const sentinel = useRef<HTMLLIElement>(null);
  const { items, status, hasMore } = useInfiniteScroll(loadPosts, {
    sentinel,
    rootMargin: "0px",
  });
  return (
    <ul data-testid="feed" style={{ height: 300, overflow: "auto", margin: 0 }}>
      {items.map((post) => (
        <li key={post} style={{ height: 40 }}>
          {post}
        </li>
      ))}
      <li ref={sentinel}>{status === "idle" && !hasMore ? "The end" : "Loading…"}</li>
    </ul>
  );
}

describe("useInfiniteScroll in a real browser", () => {
  it("loads more posts as the feed is scrolled, until the last page", async () => {
    const screen = await render(<Feed />);
    await expect.element(screen.getByText("Post 20")).toBeInTheDocument();
    await expect.element(screen.getByText("Post 21")).not.toBeInTheDocument();

    await userEvent.hover(screen.getByTestId("feed"));
    for (let scroll = 0; scroll < 30; scroll++) {
      await commands.wheel(1000);
      if (screen.getByText("The end").query()) break;
    }
    await expect.element(screen.getByText("The end")).toBeInTheDocument();
    await expect.element(screen.getByText("Post 100")).toBeInTheDocument();
  });
});

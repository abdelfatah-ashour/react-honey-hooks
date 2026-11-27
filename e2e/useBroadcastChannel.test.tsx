import { useState } from "react";
import { useBroadcastChannel } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

/** Stands in for another tab: a plain channel the test opens itself. */
let otherTab: BroadcastChannel | undefined;

afterEach(() => {
  otherTab?.close();
});

function CartBadge() {
  const [count, setCount] = useState(0);
  const post = useBroadcastChannel<number>("e2e-cart", setCount);

  return (
    <>
      <p>Cart: {count}</p>
      <button
        onClick={() => {
          setCount(count + 1);
          post(count + 1);
        }}
      >
        Add to cart
      </button>
    </>
  );
}

describe("useBroadcastChannel in a real browser", () => {
  it("tells other tabs about a click, and updates from theirs", async () => {
    otherTab = new BroadcastChannel("e2e-cart");
    const received: unknown[] = [];
    otherTab.onmessage = (event: MessageEvent) => {
      received.push(event.data);
    };
    const screen = await render(<CartBadge />);

    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    await expect.element(screen.getByText("Cart: 1")).toBeVisible();
    await expect.poll(() => received).toEqual([1]);

    otherTab.postMessage(5);
    await expect.element(screen.getByText("Cart: 5")).toBeVisible();
  });

  it("keeps two components on the same channel in sync", async () => {
    const screen = await render(
      <>
        <section aria-label="first">
          <CartBadge />
        </section>
        <section aria-label="second">
          <CartBadge />
        </section>
      </>,
    );
    const first = screen.getByRole("region", { name: "first" });
    const second = screen.getByRole("region", { name: "second" });

    await userEvent.click(first.getByRole("button", { name: "Add to cart" }));
    await expect.element(second.getByText("Cart: 1")).toBeVisible();

    await userEvent.click(second.getByRole("button", { name: "Add to cart" }));
    await expect.element(first.getByText("Cart: 2")).toBeVisible();
  });
});

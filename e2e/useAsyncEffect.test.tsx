import { useState } from "react";
import { useAsyncEffect } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

/** Loads a user's name; user 1 is slow, so a later request for user 2 finishes first. */
function loadName(id: number, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        resolve(`User ${String(id)}`);
      },
      id === 1 ? 300 : 20,
    );
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason as Error);
    });
  });
}

function Profile({ onAbort }: { onAbort: (id: number) => void }) {
  const [id, setId] = useState(0);
  const [name, setName] = useState("Nobody");
  useAsyncEffect(
    async (signal) => {
      if (id === 0) return;
      signal.addEventListener("abort", () => {
        onAbort(id);
      });
      const loaded = await loadName(id, signal);
      if (!signal.aborted) setName(loaded);
    },
    [id, onAbort],
  );
  return (
    <>
      {[1, 2].map((user) => (
        <button
          key={user}
          type="button"
          onClick={() => {
            setId(user);
          }}
        >
          Show user {user}
        </button>
      ))}
      <p>Showing {name}</p>
    </>
  );
}

describe("useAsyncEffect in a real browser", () => {
  it("cancels the slow load when another user is picked, so the latest pick wins", async () => {
    const aborted: number[] = [];
    const onAbort = (id: number) => {
      aborted.push(id);
    };
    const screen = await render(<Profile onAbort={onAbort} />);

    await userEvent.click(screen.getByRole("button", { name: "Show user 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Show user 2" }));
    await expect.element(screen.getByText("Showing User 2")).toBeVisible();
    expect(aborted).toEqual([1]);

    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect.element(screen.getByText("Showing User 2")).toBeVisible();
  });
});

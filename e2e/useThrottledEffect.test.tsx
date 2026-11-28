import { useState } from "react";
import { useThrottledEffect } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Likes({ onSync }: { onSync: (likes: number) => void }) {
  const [likes, setLikes] = useState(0);
  useThrottledEffect(
    () => {
      onSync(likes);
    },
    [likes],
    1000,
  );
  return (
    <button
      type="button"
      onClick={() => {
        setLikes((count) => count + 1);
      }}
    >
      Like ({likes})
    </button>
  );
}

describe("useThrottledEffect in a real browser", () => {
  it("syncs the first click at once and the rest of a burst once, with the final count", async () => {
    const synced: number[] = [];
    const onSync = (likes: number) => {
      synced.push(likes);
    };
    const screen = await render(<Likes onSync={onSync} />);
    const like = screen.getByRole("button");

    await userEvent.click(like);
    expect(synced).toEqual([1]);

    await userEvent.click(like);
    await userEvent.click(like);
    await expect.element(like).toHaveTextContent("Like (3)");
    expect(synced).toEqual([1]);

    await expect.poll(() => synced, { timeout: 2000 }).toEqual([1, 3]);
  });
});

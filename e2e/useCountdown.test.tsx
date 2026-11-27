import { useCountdown } from "react-honey-hooks";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

function Timer({ target, onExpire }: { target: number; onExpire: () => void }) {
  const { seconds, isExpired } = useCountdown(target, { onExpire });
  return <p>{isExpired ? "Expired" : `${String(seconds)}s left`}</p>;
}

describe("useCountdown in a real browser", () => {
  it("ticks down with real timers and calls onExpire once at zero", async () => {
    const onExpire = vi.fn();
    const screen = await render(<Timer target={Date.now() + 2500} onExpire={onExpire} />);

    await expect.element(screen.getByText("2s left")).toBeVisible();
    await expect.element(screen.getByText("1s left")).toBeVisible();
    await expect.element(screen.getByText("Expired"), { timeout: 4000 }).toBeVisible();

    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("shows a past target as expired without calling onExpire", async () => {
    const onExpire = vi.fn();
    const screen = await render(<Timer target={Date.now() - 1000} onExpire={onExpire} />);

    await expect.element(screen.getByText("Expired")).toBeVisible();
    expect(onExpire).not.toHaveBeenCalled();
  });
});

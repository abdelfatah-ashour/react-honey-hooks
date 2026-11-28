import { useState } from "react";
import { useRafInterval } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Ticker() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState(0);
  useRafInterval(
    () => {
      setTicks((count) => count + 1);
    },
    running ? 50 : null,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRunning(!running);
        }}
      >
        {running ? "Stop" : "Start"}
      </button>
      <output>{ticks}</output>
    </>
  );
}

describe("useRafInterval in a real browser", () => {
  it("ticks while running and stops when paused", async () => {
    const screen = await render(<Ticker />);
    const ticks = () => Number(screen.getByRole("status").element().textContent);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(ticks()).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "Start" }));
    await expect.poll(ticks).toBeGreaterThanOrEqual(3);

    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    const stoppedAt = ticks();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(ticks()).toBe(stoppedAt);
  });
});

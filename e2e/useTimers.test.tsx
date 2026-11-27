import { useState } from "react";
import { useInterval, useTimeout } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Ticker() {
  const [ticks, setTicks] = useState(0);
  const [running, setRunning] = useState(true);
  useInterval(
    () => {
      setTicks((t) => t + 1);
    },
    running ? 50 : null,
  );

  return (
    <>
      <p>Ticks: {ticks}</p>
      <button
        type="button"
        onClick={() => {
          setRunning(false);
        }}
      >
        Pause
      </button>
    </>
  );
}

function Toast() {
  const [visible, setVisible] = useState(true);
  useTimeout(() => {
    setVisible(false);
  }, 300);

  return visible ? <p role="status">Saved</p> : <p>Toast dismissed</p>;
}

describe("useInterval and useTimeout in a real browser", () => {
  it("ticks repeatedly until paused, then stops", async () => {
    const screen = await render(<Ticker />);
    await expect.element(screen.getByText("Ticks: 3")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    const paused = screen.getByText(/Ticks: \d+/).element().textContent;
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(screen.getByText(/Ticks: \d+/).element().textContent).toBe(paused);
  });

  it("dismisses a toast once after the delay", async () => {
    const screen = await render(<Toast />);
    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");

    await expect.element(screen.getByText("Toast dismissed")).toBeVisible();
  });
});

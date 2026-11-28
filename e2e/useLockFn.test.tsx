import { useState } from "react";
import { useLockFn } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Checkout({ pay }: { pay: () => Promise<void> }) {
  const [paid, setPaid] = useState(0);
  const submit = useLockFn(async () => {
    await pay();
    setPaid((count) => count + 1);
  });
  return (
    <>
      <button type="button" onClick={() => void submit()}>
        Pay
      </button>
      <p>Paid {paid} times</p>
    </>
  );
}

describe("useLockFn in a real browser", () => {
  it("pays once when the button is clicked again while paying", async () => {
    let finish = () => {};
    let calls = 0;
    const pay = () =>
      new Promise<void>((resolve) => {
        calls += 1;
        finish = resolve;
      });
    const screen = await render(<Checkout pay={pay} />);
    const button = screen.getByRole("button", { name: "Pay" });

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    expect(calls).toBe(1);

    finish();
    await expect.element(screen.getByText("Paid 1 times")).toBeVisible();

    await userEvent.click(button);
    expect(calls).toBe(2);
  });
});

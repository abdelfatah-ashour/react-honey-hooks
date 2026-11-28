import { useEffect } from "react";
import { useGetState } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Clicks({ onLog }: { onLog: (count: number) => void }) {
  const [count, setCount, getCount] = useGetState(0);
  // Added on mount and kept while `onLog` is the same: without getState it would only see 0.
  useEffect(() => {
    const log = () => {
      onLog(getCount());
    };
    window.addEventListener("keydown", log);
    return () => {
      window.removeEventListener("keydown", log);
    };
  }, [getCount, onLog]);
  return (
    <button
      type="button"
      onClick={() => {
        setCount((current) => current + 1);
      }}
    >
      Clicked {count} times
    </button>
  );
}

describe("useGetState in a real browser", () => {
  it("lets a listener added on mount read the latest count after real clicks", async () => {
    const logged: number[] = [];
    const onLog = (count: number) => {
      logged.push(count);
    };
    const screen = await render(<Clicks onLog={onLog} />);
    const button = screen.getByRole("button");

    await userEvent.click(button);
    await userEvent.click(button);
    await expect.element(button).toHaveTextContent("Clicked 2 times");

    await userEvent.keyboard("{Shift}");
    expect(logged).toEqual([2]);
  });
});

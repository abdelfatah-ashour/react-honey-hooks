import { memo, useEffect, useState } from "react";
import { useStableCallback } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

interface RowProps {
  onPick: () => void;
  onCommit: () => void;
}

const Row = memo(function Row({ onPick, onCommit }: RowProps) {
  // Runs after every render of `Row`, so it counts them.
  useEffect(() => {
    onCommit();
  });
  return (
    <button type="button" onClick={onPick}>
      Pick
    </button>
  );
});

function Picker({ onRowCommit }: { onRowCommit: () => void }) {
  const [count, setCount] = useState(0);
  const onPick = useStableCallback(() => {
    setCount(count + 1);
  });
  return (
    <>
      <Row onPick={onPick} onCommit={onRowCommit} />
      <p>Picked {count} times</p>
    </>
  );
}

describe("useStableCallback in a real browser", () => {
  it("uses the latest state on each click without re-rendering a memoised child", async () => {
    let rowRenders = 0;
    const onRowCommit = () => {
      rowRenders += 1;
    };
    const screen = await render(<Picker onRowCommit={onRowCommit} />);
    const pick = screen.getByRole("button", { name: "Pick" });

    await userEvent.click(pick);
    await userEvent.click(pick);
    await userEvent.click(pick);
    await expect.element(screen.getByText("Picked 3 times")).toBeVisible();
    expect(rowRenders).toBe(1);
  });
});

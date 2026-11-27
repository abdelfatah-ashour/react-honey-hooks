import { useThrottledCallback } from "react-honey-hooks";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

interface Call {
  text: string;
  at: number;
}

function Notes({ onSave }: { onSave: (text: string) => void }) {
  const save = useThrottledCallback(onSave, 500);
  return (
    <input
      aria-label="Notes"
      onChange={(event) => {
        save(event.target.value);
      }}
    />
  );
}

describe("useThrottledCallback in a real browser", () => {
  it("saves the first keystroke at once, then at most every 500 ms, ending with the full text", async () => {
    const calls: Call[] = [];
    const onSave = (text: string) => {
      calls.push({ text, at: performance.now() });
    };
    const screen = await render(<Notes onSave={onSave} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Notes" }), "honey bees");

    expect(calls[0]?.text).toBe("h");
    await vi.waitFor(() => {
      expect(calls.at(-1)?.text).toBe("honey bees");
    });
    // However fast or slow the typing was, saves never ran closer together than the wait.
    for (let i = 1; i < calls.length; i++) {
      const gap = (calls[i]?.at ?? 0) - (calls[i - 1]?.at ?? 0);
      expect(gap).toBeGreaterThanOrEqual(499);
    }
    expect(calls.length).toBeLessThan("honey bees".length);
  });
});

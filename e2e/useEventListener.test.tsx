import { useRef, useState } from "react";
import { useEventListener } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Panel() {
  const [log, setLog] = useState<string[]>([]);
  const [listening, setListening] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "keydown",
    (event) => {
      setLog((l) => [...l, `key ${event.key}`]);
    },
    { enabled: listening },
  );
  useEventListener(
    "click",
    () => {
      setLog((l) => [...l, "box clicked"]);
    },
    { target: boxRef },
  );

  return (
    <>
      <div ref={boxRef}>Box</div>
      <button
        type="button"
        onClick={() => {
          setListening(false);
        }}
      >
        Stop keys
      </button>
      <p>Log: {log.join(", ")}</p>
    </>
  );
}

describe("useEventListener in a real browser", () => {
  it("hears real key presses on window and clicks on the referenced element only", async () => {
    const screen = await render(<Panel />);

    await userEvent.keyboard("a");
    await userEvent.click(screen.getByText("Box"));
    await expect.element(screen.getByText("Log: key a, box clicked")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Stop keys" }));
    await userEvent.keyboard("b");
    await expect.element(screen.getByText("Log: key a, box clicked")).toBeVisible();
  });
});

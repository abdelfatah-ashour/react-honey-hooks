import { useSessionStorage } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Steps() {
  const [step, setStep, resetStep] = useSessionStorage("checkout-step", 1);
  return (
    <>
      <p>Step {step}</p>
      <button
        type="button"
        onClick={() => {
          setStep((s) => s + 1);
        }}
      >
        Next
      </button>
      <button type="button" onClick={resetStep}>
        Reset
      </button>
    </>
  );
}

const frames: HTMLIFrameElement[] = [];

/** A same-origin frame in this tab shares its sessionStorage, so its writes reach us as events. */
function otherDocument(): Window {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  frames.push(frame);
  const other = frame.contentWindow;
  if (!other) throw new Error("iframe has no window");
  return other;
}

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  for (const frame of frames.splice(0)) frame.remove();
});

describe("useSessionStorage in a real browser", () => {
  it("keeps the step in sessionStorage after remounting, until it is reset", async () => {
    const first = await render(<Steps />);
    await userEvent.click(first.getByRole("button", { name: "Next" }));
    await expect.element(first.getByText("Step 2")).toBeVisible();
    expect(sessionStorage.getItem("checkout-step")).toBe("2");
    expect(localStorage.getItem("checkout-step")).toBeNull();
    await first.unmount();

    const second = await render(<Steps />);
    await expect.element(second.getByText("Step 2")).toBeVisible();

    await userEvent.click(second.getByRole("button", { name: "Reset" }));
    await expect.element(second.getByText("Step 1")).toBeVisible();
    expect(sessionStorage.getItem("checkout-step")).toBeNull();
  });

  it("follows a change written by another document in this tab", async () => {
    const screen = await render(<Steps />);
    const other = otherDocument();

    other.sessionStorage.setItem("checkout-step", "4");

    await expect.element(screen.getByText("Step 4")).toBeVisible();
  });
});

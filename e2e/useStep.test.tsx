import { useStep } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

const pages = ["Account", "Profile", "Confirm"];

function SignUpWizard() {
  const { step, next, prev, isFirst, isLast } = useStep(pages.length);
  return (
    <>
      <h2>{pages[step]}</h2>
      <button type="button" onClick={prev} disabled={isFirst}>
        Back
      </button>
      <button type="button" onClick={next} disabled={isLast}>
        Next
      </button>
    </>
  );
}

describe("useStep in a real browser", () => {
  it("moves through the wizard, with Back and Next disabled at the ends", async () => {
    const screen = await render(<SignUpWizard />);
    const back = screen.getByRole("button", { name: "Back" });
    const next = screen.getByRole("button", { name: "Next" });
    await expect.element(screen.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect.element(back).toBeDisabled();

    await userEvent.click(next);
    await userEvent.click(next);
    await expect.element(screen.getByRole("heading", { name: "Confirm" })).toBeVisible();
    await expect.element(next).toBeDisabled();

    await userEvent.click(back);
    await expect.element(screen.getByRole("heading", { name: "Profile" })).toBeVisible();
  });
});

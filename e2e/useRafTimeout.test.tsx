import { useState } from "react";
import { useRafTimeout } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Toast() {
  const [visible, setVisible] = useState(false);
  useRafTimeout(
    () => {
      setVisible(false);
    },
    visible ? 200 : null,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVisible(true);
        }}
      >
        Save
      </button>
      {visible && <p role="status">Saved</p>}
    </>
  );
}

describe("useRafTimeout in a real browser", () => {
  it("hides a toast on a frame after the delay", async () => {
    const screen = await render(<Toast />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await expect.element(screen.getByRole("status")).toBeVisible();
    await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
  });
});

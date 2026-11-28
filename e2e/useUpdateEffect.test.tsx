import { useState } from "react";
import { useUpdateEffect } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Settings() {
  const [volume, setVolume] = useState(5);
  const [message, setMessage] = useState("");
  useUpdateEffect(() => {
    setMessage(`Saved volume ${String(volume)}`);
  }, [volume]);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVolume((current) => current + 1);
        }}
      >
        Louder
      </button>
      <p role="status">{message}</p>
    </>
  );
}

describe("useUpdateEffect in a real browser", () => {
  it("doesn't announce a save on load, only after the setting changes", async () => {
    const screen = await render(<Settings />);
    await expect.element(screen.getByRole("status")).toHaveTextContent("");

    await userEvent.click(screen.getByRole("button", { name: "Louder" }));
    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved volume 6");
  });
});

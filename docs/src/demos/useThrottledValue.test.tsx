import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useThrottledValue";

describe("useThrottledValue demo", () => {
  it("keeps the preview in step with typing, catching up with the latest text", async () => {
    const screen = await render(<Demo />);
    const message = screen.getByRole("textbox", { name: "Message" });
    const preview = screen.getByRole("status");
    await expect.element(preview).toHaveTextContent("Nothing to preview");

    await userEvent.type(message, "Hello there");
    await expect.element(preview).toHaveTextContent("Hello there");

    await userEvent.clear(message);
    await expect.element(preview).toHaveTextContent("Nothing to preview");
  });
});

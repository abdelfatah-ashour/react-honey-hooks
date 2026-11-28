import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useLocalStorage";

describe("useLocalStorage demo", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("remembers the name after the demo mounts again, until it is forgotten", async () => {
    const first = await render(<Demo />);
    await expect.element(first.getByRole("status")).toHaveTextContent("Hello, stranger!");

    await userEvent.type(first.getByRole("textbox", { name: "Your name" }), "Ada");
    await expect.element(first.getByRole("status")).toHaveTextContent("Hello, Ada!");
    await first.unmount();

    const second = await render(<Demo />);
    await expect.element(second.getByRole("status")).toHaveTextContent("Hello, Ada!");
    await expect.element(second.getByRole("textbox", { name: "Your name" })).toHaveValue("Ada");

    await userEvent.click(second.getByRole("button", { name: "Forget me" }));
    await expect.element(second.getByRole("status")).toHaveTextContent("Hello, stranger!");
    await expect.element(second.getByRole("textbox", { name: "Your name" })).toHaveValue("");
  });
});

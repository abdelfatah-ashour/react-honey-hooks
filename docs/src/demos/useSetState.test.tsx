import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useSetState";

describe("useSetState demo", () => {
  it("updates one field at a time and keeps the others", async () => {
    const screen = await render(<Demo />);
    const card = screen.getByRole("status");
    const name = screen.getByRole("textbox", { name: "Name" });
    await expect.element(card).toHaveTextContent("No name · no email");

    await userEvent.type(name, "Ada");
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.com");
    await expect.element(card).toHaveTextContent("Ada · ada@example.com");

    await userEvent.click(screen.getByRole("button", { name: "Clear email" }));
    await expect.element(card).toHaveTextContent("Ada · no email");
    await expect.element(name).toHaveValue("Ada");
  });
});

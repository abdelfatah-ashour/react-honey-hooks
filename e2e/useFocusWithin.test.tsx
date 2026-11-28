import { useRef } from "react";
import { useFocusWithin } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Address() {
  const ref = useRef<HTMLFieldSetElement>(null);
  const focused = useFocusWithin(ref);
  return (
    <>
      <fieldset ref={ref} data-testid="address">
        <input aria-label="Street" />
        <input aria-label="City" />
      </fieldset>
      <input aria-label="Notes" />
      <p>{focused ? "Editing address" : "Not editing address"}</p>
    </>
  );
}

describe("useFocusWithin in a real browser", () => {
  it("matches :focus-within as focus moves in, within, out and away", async () => {
    const screen = await render(<Address />);
    const address = screen.getByTestId("address").element();
    const editing = screen.getByText("Editing address", { exact: true });
    const notEditing = screen.getByText("Not editing address");

    await userEvent.click(screen.getByRole("textbox", { name: "Street" }));
    await expect.element(editing).toBeVisible();
    expect(address.matches(":focus-within")).toBe(true);

    await userEvent.tab();
    await expect.element(screen.getByRole("textbox", { name: "City" })).toHaveFocus();
    await expect.element(editing).toBeVisible();

    await userEvent.tab();
    await expect.element(screen.getByRole("textbox", { name: "Notes" })).toHaveFocus();
    await expect.element(notEditing).toBeVisible();
    expect(address.matches(":focus-within")).toBe(false);

    await userEvent.click(screen.getByRole("textbox", { name: "City" }));
    await expect.element(editing).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
    await expect.element(notEditing).toBeVisible();
  });
});

import { useRef, useState } from "react";
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

/**
 * The README's search box: suggestions render only while focus is inside it. They are list items
 * with `tabIndex`, which every browser tabs to (Safari's Tab skips buttons by default).
 */
function SearchBox() {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useFocusWithin(ref);
  return (
    <>
      <div ref={ref}>
        <input type="search" aria-label="Search" />
        {focused && (
          <ul aria-label="Suggestions">
            <li tabIndex={0}>React</li>
            <li tabIndex={0}>Hooks</li>
          </ul>
        )}
      </div>
      <input aria-label="Next field" />
    </>
  );
}

/** A search box whose field saves a draft on blur, re-rendering while focus moves on. */
function SearchBoxWithDraft() {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useFocusWithin(ref);
  const [saves, setSaves] = useState(0);
  return (
    <div ref={ref}>
      <input
        type="search"
        aria-label="Search"
        onBlur={() => {
          setSaves((count) => count + 1);
        }}
      />
      {focused && (
        <ul aria-label="Suggestions">
          <li tabIndex={0}>React</li>
        </ul>
      )}
      <p>Draft saved {saves} times</p>
    </div>
  );
}

/** A field whose tip disappears when the field loses focus, before Tab can land on it. */
function FieldWithTip() {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useFocusWithin(ref);
  const [tip, setTip] = useState(true);
  return (
    <>
      <div ref={ref}>
        <input
          aria-label="Name"
          onBlur={() => {
            setTip(false);
          }}
        />
        {tip && <p tabIndex={0}>Use your full name</p>}
      </div>
      <p>{focused ? "Editing name" : "Not editing name"}</p>
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

  it("keeps content that renders only while focused open as Tab moves into it", async () => {
    const screen = await render(<SearchBox />);
    const suggestions = screen.getByRole("list", { name: "Suggestions" });

    await userEvent.click(screen.getByRole("searchbox", { name: "Search" }));
    await expect.element(suggestions).toBeVisible();

    await userEvent.tab();
    await expect.element(screen.getByText("React")).toHaveFocus();
    await expect.element(suggestions).toBeVisible();

    await userEvent.tab();
    await expect.element(screen.getByText("Hooks")).toHaveFocus();

    await userEvent.tab();
    await expect.element(screen.getByRole("textbox", { name: "Next field" })).toHaveFocus();
    await expect.element(suggestions).not.toBeInTheDocument();
  });

  it("stays true when a blur handler re-renders while focus moves inside", async () => {
    const screen = await render(<SearchBoxWithDraft />);

    await userEvent.click(screen.getByRole("searchbox", { name: "Search" }));
    await userEvent.tab();

    await expect.element(screen.getByText("React")).toHaveFocus();
    await expect.element(screen.getByText("Draft saved 1 times")).toBeVisible();
    await expect.element(screen.getByRole("list", { name: "Suggestions" })).toBeVisible();
  });

  it("is false when the element focus was moving to is removed before focus lands", async () => {
    const screen = await render(<FieldWithTip />);

    await userEvent.click(screen.getByRole("textbox", { name: "Name" }));
    await expect.element(screen.getByText("Editing name")).toBeVisible();

    await userEvent.tab();
    await expect.element(screen.getByText("Use your full name")).not.toBeInTheDocument();
    await expect.element(screen.getByText("Not editing name")).toBeVisible();
  });
});

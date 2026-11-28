import { useSelections } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

const emails = [
  { id: 1, subject: "Invoice" },
  { id: 2, subject: "Lunch?" },
  { id: 3, subject: "Release notes" },
];

function Inbox() {
  const { isSelected, toggle, toggleAll, allSelected, partiallySelected, selected } = useSelections(
    emails,
    { getKey: (email) => email.id },
  );
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(box) => {
            if (box) box.indeterminate = partiallySelected;
          }}
          onChange={toggleAll}
        />
        Select all
      </label>
      {emails.map((email) => (
        <label key={email.id}>
          <input
            type="checkbox"
            checked={isSelected(email)}
            onChange={() => {
              toggle(email);
            }}
          />
          {email.subject}
        </label>
      ))}
      <p>{selected.length} selected</p>
    </>
  );
}

describe("useSelections in a real browser", () => {
  it("selects emails one by one and all at once, with an indeterminate select-all box", async () => {
    const screen = await render(<Inbox />);
    const all = screen.getByRole("checkbox", { name: "Select all" });

    await userEvent.click(screen.getByRole("checkbox", { name: "Lunch?" }));
    await expect.element(screen.getByText("1 selected")).toBeVisible();
    await expect.element(all).toBePartiallyChecked();

    await userEvent.click(all);
    await expect.element(screen.getByText("3 selected")).toBeVisible();
    await expect.element(all).toBeChecked();
    await expect.element(screen.getByRole("checkbox", { name: "Invoice" })).toBeChecked();

    await userEvent.click(all);
    await expect.element(screen.getByText("0 selected")).toBeVisible();
    await expect.element(all).not.toBeChecked();
  });
});

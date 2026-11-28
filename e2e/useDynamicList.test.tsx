import { useDynamicList } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Guests() {
  const { list, getKey, push, remove, move } = useDynamicList(["Guest 1", "Guest 2"]);
  return (
    <>
      {list.map((label, index) => (
        <fieldset key={getKey(index)} aria-label={label}>
          {/* Uncontrolled, so the typed name only stays with its row if the key does. */}
          <input aria-label="Name" />
          <button
            type="button"
            onClick={() => {
              move(index, index - 1);
            }}
          >
            Move up
          </button>
          <button
            type="button"
            onClick={() => {
              remove(index);
            }}
          >
            Remove
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => {
          push(`Guest ${String(list.length + 1)}`);
        }}
      >
        Add guest
      </button>
    </>
  );
}

describe("useDynamicList in a real browser", () => {
  it("keeps what was typed in each row as rows are added, moved and removed", async () => {
    const screen = await render(<Guests />);
    await userEvent.fill(
      screen.getByRole("group", { name: "Guest 1" }).getByLabelText("Name"),
      "Ada",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add guest" }));
    await userEvent.fill(
      screen.getByRole("group", { name: "Guest 3" }).getByLabelText("Name"),
      "Grace",
    );

    await userEvent.click(
      screen.getByRole("group", { name: "Guest 3" }).getByRole("button", { name: "Move up" }),
    );
    await userEvent.click(
      screen.getByRole("group", { name: "Guest 1" }).getByRole("button", { name: "Remove" }),
    );

    const rows = screen.getByRole("group").all();
    expect(rows.map((row) => row.element().getAttribute("aria-label"))).toEqual([
      "Guest 3",
      "Guest 2",
    ]);
    await expect
      .element(screen.getByRole("group", { name: "Guest 3" }).getByLabelText("Name"))
      .toHaveValue("Grace");
    await expect
      .element(screen.getByRole("group", { name: "Guest 2" }).getByLabelText("Name"))
      .toHaveValue("");
  });
});

import { useState } from "react";
import { useBeforeUnload } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function CommentBox() {
  const [draft, setDraft] = useState("");
  useBeforeUnload(draft !== "");
  return (
    <textarea
      aria-label="Comment"
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
    />
  );
}

/**
 * The test runs inside a frame it can't navigate away from, so it fires the browser's own
 * `beforeunload` event and checks it was cancelled, which is what makes the browser warn.
 */
function leavingIsBlocked(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("useBeforeUnload in a real browser", () => {
  it("blocks leaving only while the comment has unsaved text", async () => {
    const screen = await render(<CommentBox />);
    const comment = screen.getByRole("textbox", { name: "Comment" });
    expect(leavingIsBlocked()).toBe(false);

    await userEvent.type(comment, "Nice post");
    expect(leavingIsBlocked()).toBe(true);

    await userEvent.clear(comment);
    expect(leavingIsBlocked()).toBe(false);
  });
});

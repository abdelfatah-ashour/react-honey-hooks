import { useState } from "react";
import { usePrevious } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Pager() {
  const [page, setPage] = useState(1);
  const [clicks, setClicks] = useState(0);
  const previousPage = usePrevious(page);

  return (
    <>
      <button
        onClick={() => {
          setPage((current) => current + 1);
        }}
      >
        Next page
      </button>
      <button
        onClick={() => {
          setClicks((current) => current + 1);
        }}
      >
        Re-render
      </button>
      <p>
        Page {page}, was {previousPage ?? "none"} ({clicks} re-renders)
      </p>
    </>
  );
}

describe("usePrevious in a real browser", () => {
  it("shows the page before the last change, and ignores unrelated re-renders", async () => {
    const screen = await render(<Pager />);
    await expect.element(screen.getByText("Page 1, was none (0 re-renders)")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await expect.element(screen.getByText("Page 2, was 1 (0 re-renders)")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await userEvent.click(screen.getByRole("button", { name: "Re-render" }));
    await expect.element(screen.getByText("Page 3, was 2 (1 re-renders)")).toBeVisible();
  });
});

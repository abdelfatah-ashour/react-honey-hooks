import { useState } from "react";
import { type EventEmitter, useEventEmitter } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Toolbar({ refresh }: { refresh: EventEmitter<void> }) {
  return (
    <button
      type="button"
      onClick={() => {
        refresh.emit();
      }}
    >
      Refresh
    </button>
  );
}

function Feed({ refresh }: { refresh: EventEmitter<void> }) {
  const [loads, setLoads] = useState(1);
  refresh.useSubscription(() => {
    setLoads((count) => count + 1);
  });
  return <p>Loaded {loads} times</p>;
}

function Page() {
  const refresh = useEventEmitter();
  const [showFeed, setShowFeed] = useState(true);
  return (
    <>
      <Toolbar refresh={refresh} />
      <button
        type="button"
        onClick={() => {
          setShowFeed(false);
        }}
      >
        Hide feed
      </button>
      {showFeed && <Feed refresh={refresh} />}
    </>
  );
}

describe("useEventEmitter in a real browser", () => {
  it("lets a toolbar tell a sibling feed to reload, until the feed unmounts", async () => {
    const screen = await render(<Page />);

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await expect.element(screen.getByText("Loaded 3 times")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Hide feed" }));
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await expect.element(screen.getByText(/Loaded/)).not.toBeInTheDocument();
  });
});

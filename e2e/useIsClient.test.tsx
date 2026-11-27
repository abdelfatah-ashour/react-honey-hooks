import { useIsClient } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

function Where() {
  return <p>{useIsClient() ? "Rendered in the browser" : "Rendered on the server"}</p>;
}

describe("useIsClient in a real browser", () => {
  it("is true when rendered in the browser", async () => {
    const screen = await render(<Where />);

    await expect.element(screen.getByText("Rendered in the browser")).toBeVisible();
  });
});

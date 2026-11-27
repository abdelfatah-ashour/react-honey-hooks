import { useScript } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

declare global {
  interface Window {
    honeyGreeting?: string;
  }
}

/** A real script that sets a global, as a third-party SDK would. */
const GREETING_SCRIPT = `data:text/javascript,${encodeURIComponent('window.honeyGreeting = "hello";')}`;

function Widget({ src }: { src: string }) {
  const status = useScript(src);
  return (
    <p>
      Status: {status}
      {status === "ready" && `, says ${window.honeyGreeting ?? "nothing"}`}
    </p>
  );
}

describe("useScript in a real browser", () => {
  it("loads and runs the script, then reports ready", async () => {
    const screen = await render(<Widget src={GREETING_SCRIPT} />);

    await expect.element(screen.getByText("Status: ready, says hello")).toBeVisible();
  });

  it("reports an error for a script that can't load", async () => {
    // Port 1 has nothing listening, so the request fails at once.
    const screen = await render(<Widget src="http://localhost:1/missing.js" />);

    await expect.element(screen.getByText("Status: error")).toBeVisible();
  });
});

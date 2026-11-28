import { useState } from "react";
import { useWebSocket } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Chat({ url }: { url: string }) {
  const [draft, setDraft] = useState("");
  const { readyState, lastMessage, send, disconnect } = useWebSocket(url, {
    reconnect: { attempts: 5, intervalMs: 200 },
  });
  return (
    <>
      <p>Status: {readyState}</p>
      <input
        aria-label="Message"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (send(draft)) setDraft("");
        }}
      >
        Send
      </button>
      <button type="button" onClick={disconnect}>
        Leave
      </button>
      <p>Echo: {typeof lastMessage?.data === "string" ? lastMessage.data : ""}</p>
    </>
  );
}

describe("useWebSocket in a real browser", () => {
  it("talks to a real server, reconnects after the connection drops, and leaves", async () => {
    const port = await commands.startEchoServer();
    const screen = await render(<Chat url={`ws://127.0.0.1:${String(port)}`} />);
    await expect.element(screen.getByText("Status: open")).toBeVisible();

    await userEvent.fill(screen.getByLabelText("Message"), "Hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await expect.element(screen.getByText("Echo: Hello")).toBeVisible();

    await commands.dropEchoClients(port);
    await expect.element(screen.getByText("Status: closed")).toBeVisible();
    await expect.element(screen.getByText("Status: open")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Leave" }));
    await expect.element(screen.getByText("Status: closed")).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect.element(screen.getByText("Status: closed")).toBeVisible();
  });
});

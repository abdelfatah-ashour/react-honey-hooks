import { useEffect, useState } from "react";
import { useLatest } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Draft({ onSave }: { onSave: (text: string) => void }) {
  const [text, setText] = useState("");
  const latestText = useLatest(text);
  // Listens once, for the component's whole life, yet saves what is typed now.
  useEffect(() => {
    const save = (event: KeyboardEvent) => {
      if (event.key === "Enter") onSave(latestText.current);
    };
    window.addEventListener("keydown", save);
    return () => {
      window.removeEventListener("keydown", save);
    };
  }, [latestText, onSave]);
  return (
    <input
      aria-label="Draft"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
      }}
    />
  );
}

describe("useLatest in a real browser", () => {
  it("lets a listener added once read what was typed since", async () => {
    const saved: string[] = [];
    const onSave = (text: string) => {
      saved.push(text);
    };
    const screen = await render(<Draft onSave={onSave} />);

    await userEvent.type(screen.getByLabelText("Draft"), "Hello{Enter}");
    await userEvent.type(screen.getByLabelText("Draft"), ", world{Enter}");
    expect(saved).toEqual(["Hello", "Hello, world"]);
  });
});

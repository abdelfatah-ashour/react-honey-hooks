import { useRef } from "react";
import { useTextSelection } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Article() {
  const article = useRef<HTMLElement>(null);
  const { text, rect } = useTextSelection(article);
  return (
    <>
      <article ref={article}>
        <p>Bees make honey from nectar.</p>
      </article>
      <p>Not part of the article.</p>
      <output>{text ? `Quote: ${text}` : "Nothing selected"}</output>
      <output aria-label="Box">{rect && rect.width > 0 ? "Has a box" : "No box"}</output>
    </>
  );
}

describe("useTextSelection in a real browser", () => {
  it("shows the text selected in the article, with its box, and ignores text outside it", async () => {
    const screen = await render(<Article />);
    await expect.element(screen.getByText("Nothing selected")).toBeVisible();

    await userEvent.tripleClick(screen.getByText("Bees make honey from nectar."));
    await expect.element(screen.getByText(/Quote: Bees make honey from nectar\./)).toBeVisible();
    await expect.element(screen.getByLabelText("Box")).toHaveTextContent("Has a box");

    await userEvent.tripleClick(screen.getByText("Not part of the article."));
    await expect.element(screen.getByText("Nothing selected")).toBeVisible();
  });
});

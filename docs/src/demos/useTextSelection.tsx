import { useRef, useState } from "react";
import { useTextSelection } from "react-honey-hooks";

/** A "Quote" button that pops up under text you select in the article. */
export default function UseTextSelectionDemo() {
  const articleRef = useRef<HTMLElement>(null);
  const { text, rect } = useTextSelection(articleRef);
  const [quote, setQuote] = useState("");

  return (
    <div>
      <p>Select a sentence below to quote it.</p>
      <article ref={articleRef}>
        <p>A bee visits about two million flowers to make one jar of honey.</p>
      </article>
      {rect && text.trim() && (
        <button
          type="button"
          className="button button--sm button--primary"
          style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, zIndex: 1 }}
          // Keep the selection when the button is pressed.
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setQuote(text.trim());
            document.getSelection()?.removeAllRanges();
          }}
        >
          Quote
        </button>
      )}
      <blockquote role="status">{quote && `“${quote}”`}</blockquote>
    </div>
  );
}

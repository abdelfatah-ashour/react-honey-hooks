import { useRef, useState } from "react";
import { useElementSize } from "react-honey-hooks";

/** A box that reports its own size; drag its corner or use the buttons to resize it. */
export default function UseElementSizeDemo() {
  const [boxWidth, setBoxWidth] = useState(240);
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref, { box: "border-box" });

  return (
    <div>
      <div
        ref={ref}
        style={{
          width: boxWidth,
          height: 96,
          maxWidth: "100%",
          boxSizing: "border-box",
          padding: "0.5rem",
          border: "2px dashed var(--ifm-color-primary)",
          resize: "both",
          overflow: "auto",
        }}
      >
        <p role="status">
          {Math.round(width)} × {Math.round(height)} px
        </p>
      </div>
      <div className="button-group margin-top--sm">
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={boxWidth <= 120}
          onClick={() => {
            setBoxWidth(boxWidth - 120);
          }}
        >
          Narrower
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={boxWidth >= 360}
          onClick={() => {
            setBoxWidth(boxWidth + 120);
          }}
        >
          Wider
        </button>
      </div>
    </div>
  );
}

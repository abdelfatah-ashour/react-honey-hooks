import { useRef } from "react";
import { useInView } from "react-honey-hooks";

/** A picture that fades in as it scrolls into view, and out again as it leaves. */
export default function UseInViewDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.5 });

  return (
    <div>
      <p role="status">{inView ? "Picture in view" : "Picture out of view"}</p>
      <div
        style={{
          height: 160,
          overflowY: "auto",
          border: "1px solid var(--ifm-color-emphasis-300)",
        }}
      >
        <p style={{ height: 240, padding: "0.5rem" }}>Scroll down to see the picture.</p>
        <div
          ref={ref}
          role="img"
          aria-label="A sunset over the hills"
          style={{
            height: 120,
            margin: "0 0.5rem 0.5rem",
            borderRadius: 8,
            background: "linear-gradient(#f9a03f, #d45079 60%, #4a2c6d)",
            opacity: inView ? 1 : 0,
            transition: "opacity 400ms ease-in",
          }}
        />
      </div>
    </div>
  );
}

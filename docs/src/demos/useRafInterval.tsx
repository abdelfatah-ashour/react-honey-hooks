import { useState } from "react";
import { useRafInterval } from "react-honey-hooks";

const SLIDES = ["🌅 Sunrise", "🏔️ Mountains", "🌊 Ocean", "🌌 Night sky"];

/** A slideshow that moves on every 0.7 s while playing, and rests while the tab is hidden. */
export default function UseRafIntervalDemo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useRafInterval(
    () => {
      setIndex((i) => (i + 1) % SLIDES.length);
    },
    playing ? 700 : null,
  );

  return (
    <div>
      <p style={{ fontSize: "2rem", margin: 0 }}>{SLIDES[index]}</p>
      <p role="status">
        Slide {index + 1} of {SLIDES.length}
      </p>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => {
          setPlaying((p) => !p);
        }}
      >
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}

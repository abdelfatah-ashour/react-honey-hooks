import { useWindowSize } from "react-honey-hooks";

/** Shows the window's size and orientation; resize the window to watch them change. */
export default function UseWindowSizeDemo() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <span className="badge badge--primary">{width >= height ? "Landscape" : "Portrait"}</span>
      <p role="status" className="margin-top--sm">
        {width} × {height} px
      </p>
      <p>Resize your browser window to see the size update.</p>
    </div>
  );
}

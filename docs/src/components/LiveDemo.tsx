import type { ComponentType } from "react";

interface LiveDemoProps {
  /** The demo component to run on the page. */
  demo: ComponentType;
}

/** Runs a hook's demo in a box, as a playground; the page's Example section shows usage code. */
export default function LiveDemo({ demo: Demo }: LiveDemoProps) {
  return (
    <div className="demo">
      <Demo />
    </div>
  );
}

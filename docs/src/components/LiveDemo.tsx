import CodeBlock from "@theme/CodeBlock";
import type { ComponentType } from "react";

interface LiveDemoProps {
  /** The demo component to run on the page. */
  demo: ComponentType;
  /** The demo's source code, imported with `!!raw-loader!`, shown below it. */
  source: string;
}

/** Runs a hook's demo in a box, with the demo's own source code below it. */
export default function LiveDemo({ demo: Demo, source }: LiveDemoProps) {
  return (
    <>
      <div className="demo">
        <Demo />
      </div>
      <CodeBlock language="tsx" title="Demo source">
        {source.trim()}
      </CodeBlock>
    </>
  );
}

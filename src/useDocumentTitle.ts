import { useEffect, useRef } from "react";

export interface DocumentTitleOptions {
  /** Put back the title from before the component mounted when it unmounts. Defaults to `false`. */
  restoreOnUnmount?: boolean;
}

/**
 * Sets the document's title (the browser tab's text) to `title`, and again whenever it
 * changes. With `restoreOnUnmount`, the title from before the component mounted is put back
 * when it unmounts; otherwise the title stays. It does nothing during server rendering. In
 * React 19 you can also render a `<title>` element; this hook works in React 18 too, and adds
 * the restore option.
 */
export function useDocumentTitle(
  title: string,
  { restoreOnUnmount = false }: DocumentTitleOptions = {},
): void {
  const restore = useRef(restoreOnUnmount);
  useEffect(() => {
    restore.current = restoreOnUnmount;
  });

  // Declared before the effect that sets the title, so it records the title from before.
  useEffect(() => {
    const previous = document.title;
    return () => {
      if (restore.current) document.title = previous;
    };
  }, []);

  useEffect(() => {
    document.title = title;
  }, [title]);
}

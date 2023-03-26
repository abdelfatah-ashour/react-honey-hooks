import { useEffect } from "react";
import { DetectOutsideProps } from "./types";

/**
 * Hook that alerts clicks outside of the passed ref
 */
export function useOutsideElement({ ref, callback }: DetectOutsideProps) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside, false);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside, false);
    };
  }, [callback, ref]);
}

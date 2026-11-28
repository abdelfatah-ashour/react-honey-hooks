import { useWindowScroll } from "react-honey-hooks";

/** A back-to-top button that appears once you scroll this page down. */
export default function UseWindowScrollDemo() {
  const { y } = useWindowScroll();

  return (
    <div>
      <p role="status">Scrolled {Math.round(y)}px</p>
      <p>Scroll the page down past 300px and a back-to-top button appears.</p>
      {y > 300 && (
        <button
          type="button"
          className="button button--primary shadow--md"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Back to top
        </button>
      )}
    </div>
  );
}

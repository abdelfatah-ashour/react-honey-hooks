import { useMediaQuery } from "react-honey-hooks";

/** A navigation bar that shows its links on wide windows and a menu button on narrow ones. */
export default function UseMediaQueryDemo() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div>
      <span role="status" className="badge badge--primary">
        {isDesktop ? "Desktop layout" : "Mobile layout"}
      </span>
      <nav aria-label="Demo" className="margin-top--sm">
        {isDesktop ? (
          <div className="button-group">
            {["Home", "Pricing", "Blog"].map((page) => (
              <button key={page} type="button" className="button button--secondary button--sm">
                {page}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="button button--secondary button--sm"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
      </nav>
      <p className="margin-top--sm">Resize the window across 768px to switch layouts.</p>
    </div>
  );
}

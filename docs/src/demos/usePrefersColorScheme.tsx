import { usePrefersColorScheme } from "react-honey-hooks";

const themes = {
  light: { background: "#f8fafc", color: "#0f172a", icon: "☀️" },
  dark: { background: "#0f172a", color: "#f1f5f9", icon: "🌙" },
};

/** A card that follows your system's light or dark setting; change it to see the card switch. */
export default function UsePrefersColorSchemeDemo() {
  const scheme = usePrefersColorScheme();
  const { background, color, icon } = themes[scheme];

  return (
    <div
      style={{
        background,
        color,
        padding: "1rem",
        borderRadius: "var(--ifm-global-radius)",
        border: "1px solid var(--ifm-color-emphasis-300)",
      }}
    >
      <span aria-hidden="true">{icon}</span>{" "}
      <strong role="status">{scheme === "dark" ? "Dark theme" : "Light theme"}</strong>
      <p style={{ margin: "0.5rem 0 0" }}>
        Switch your operating system between light and dark mode.
      </p>
    </div>
  );
}

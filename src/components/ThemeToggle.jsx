import { Sun, Moon } from "lucide-react";

/**
 * ThemeToggle — Dark/Paper mode toggle for the Navbar.
 * Toggles via the parent's isDarkMode state.
 */
export default function ThemeToggle({ isDarkMode, setIsDarkMode }) {
  return (
    <button
      id="theme-toggle"
      onClick={() => setIsDarkMode((prev) => !prev)}
      className="theme-toggle-btn"
      aria-label={isDarkMode ? "Switch to paper (light) mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to paper mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun size={14} className="text-white/70" aria-hidden="true" />
      ) : (
        <Moon size={14} className="text-black/60" aria-hidden="true" />
      )}
    </button>
  );
}

import { useEffect, useRef, useState } from "react";
import { Radio, ChevronDown } from "lucide-react";
import gsap from "gsap";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ isDarkMode, setIsDarkMode }) {
  const navRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  return (
    <nav
      ref={navRef}
      id="navbar-main"
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-auto max-w-[calc(100vw-2rem)] ${
        scrolled ? "top-3" : "top-5"
      }`}
      style={{ opacity: 0 }}
    >
      <div
        className={`flex items-center gap-4 md:gap-6 px-5 md:px-8 py-3 md:py-3.5 border-2 border-black transition-all duration-500 ${
          scrolled
            ? "bg-black/95 backdrop-blur-xl shadow-[4px_4px_0px_#E63B2E]"
            : "bg-offwhite/95 backdrop-blur-xl shadow-[4px_4px_0px_#111111]"
        }`}
        style={{ borderRadius: "2rem" }}
      >
        {/* Logo */}
        <a
          href="#"
          id="navbar-logo"
          className="flex items-center gap-1 no-underline"
        >
          <span
            className={`text-lg md:text-xl font-bold tracking-tight font-heading ${
              scrolled ? "text-white" : "text-black"
            }`}
          >
            Book
          </span>
          <span
            className="text-lg md:text-xl font-bold tracking-tight font-heading text-signal"
          >
            Pulse
          </span>
        </a>

        {/* Divider */}
        <div
          className={`w-px h-5 ${scrolled ? "bg-white/20" : "bg-black/15"}`}
        />

        {/* Live Sync */}
        <div className="flex items-center gap-2" id="navbar-sync">
          <div className="pulse-dot">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span
            className={`text-xs font-data tracking-wide hidden sm:inline ${
              scrolled ? "text-white/70" : "text-midgray"
            }`}
          >
            LIVE SYNC
          </span>
        </div>

        {/* Divider */}
        <div
          className={`w-px h-5 hidden md:block ${scrolled ? "bg-white/20" : "bg-black/15"}`}
        />

        {/* Theme Toggle */}
        <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

        {/* Divider */}
        <div
          className={`w-px h-5 hidden md:block ${scrolled ? "bg-white/20" : "bg-black/15"}`}
        />

        {/* Country Toggle */}
        <button
          id="navbar-country"
          className={`flex items-center gap-1.5 text-xs font-data tracking-wide cursor-pointer bg-transparent border-none hidden md:flex ${
            scrolled ? "text-white/70" : "text-midgray"
          }`}
        >
          <Radio size={13} />
          <span>PH</span>
          <ChevronDown size={12} />
        </button>
      </div>
    </nav>
  );
}

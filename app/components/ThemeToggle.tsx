"use client";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#d8b4fe] bg-white text-xs font-semibold text-[#700d2b] shadow-xs hover:bg-[#f3e8ff] transition-colors"
      title={`สลับเป็นโหมด${theme === "light" ? "มืด" : "สว่าง"}`}
    >
      <span>{theme === "light" ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer en clair" : "Passer en sombre"}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-neutral-600 ring-1 ring-neutral-200 backdrop-blur dark:bg-neutral-800/70 dark:text-neutral-300 dark:ring-neutral-700"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

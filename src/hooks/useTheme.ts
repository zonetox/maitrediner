import { useEffect, useState } from "react";

export type Theme = "gold" | "emerald" | "midnight";
export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "gold", label: "Gold", swatch: "oklch(0.82 0.14 82)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.55 0.12 165)" },
  { id: "midnight", label: "Midnight", swatch: "oklch(0.5 0.13 255)" },
];

const KEY = "maison-theme";

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem(KEY, t); } catch {}
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "gold";
    return (document.documentElement.getAttribute("data-theme") as Theme) || "gold";
  });
  useEffect(() => { applyTheme(theme); }, [theme]);
  return { theme, setTheme };
}

import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme, THEMES, type Theme } from "@/hooks/useTheme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Đổi tông màu"
        className="h-9 w-9 grid place-items-center rounded-full border border-border hover:border-gold hover:text-gold transition"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-elegant p-1 z-50">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">Tông màu</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id as Theme); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm transition"
            >
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ background: t.swatch }}
              />
              <span className="flex-1 text-left">{t.label}</span>
              {theme === t.id && <Check className="h-3.5 w-3.5 text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

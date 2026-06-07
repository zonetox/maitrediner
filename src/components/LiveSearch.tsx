import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, Loader2, CornerDownLeft } from "lucide-react";

export type Suggestion = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  to: string;
  badge?: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  fetcher: (q: string) => Promise<Suggestion[]>;
  onSubmit?: (q: string) => void;
  variant?: "hero" | "pill";
  className?: string;
  emptyLabel?: string;
  hintLabel?: string;
};

export function LiveSearch({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  fetcher,
  onSubmit,
  variant = "hero",
  className = "",
  emptyLabel = "Không tìm thấy kết quả.",
  hintLabel = "Bắt đầu gõ để xem gợi ý…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const reqId = useRef(0);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setItems([]);
      setLoading(false);
      return;
    }
    const my = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetcher(q);
        if (my === reqId.current) {
          setItems(res);
          setActive(0);
        }
      } finally {
        if (my === reqId.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [value, fetcher]);

  function go(s: Suggestion) {
    setOpen(false);
    navigate({ to: s.to as any });
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (open && items[active]) {
        e.preventDefault();
        go(items[active]);
      } else {
        onSubmit?.(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const wrap =
    variant === "hero"
      ? "flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition focus-within:bg-secondary/60"
      : "flex items-center gap-3 px-4 py-3 rounded-full bg-card border border-border focus-within:border-gold transition";

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className={wrap}>
        <Search className="h-4 w-4 text-gold shrink-0" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
        {!loading && value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setItems([]);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-gold"
            aria-label="Xoá"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (value.trim().length > 0 || items.length > 0) && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-elegant overflow-hidden animate-fade-in">
          {loading && items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Đang tìm…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {value.trim() ? emptyLabel : hintLabel}
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {items.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(s)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition ${
                      i === active ? "bg-secondary/70 text-gold" : "hover:bg-secondary/40 text-foreground/90"
                    }`}
                  >
                    {s.image ? (
                      <img
                        src={s.image}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-secondary/60 border border-border grid place-items-center shrink-0">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-sm truncate">{s.title}</div>
                      {s.subtitle && (
                        <div className="text-[11px] text-muted-foreground truncate tracking-wide">
                          {s.subtitle}
                        </div>
                      )}
                    </div>
                    {s.badge && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-gold/90 px-2 py-0.5 rounded-full border border-gold/30">
                        {s.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {onSubmit && value.trim() && (
                <li className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSubmit(value);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-gold hover:bg-secondary/40 transition flex items-center justify-between"
                  >
                    <span>Xem tất cả kết quả cho “{value.trim()}”</span>
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

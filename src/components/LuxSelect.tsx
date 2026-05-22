import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export function LuxSelect({
  value, onChange, placeholder, options, icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition text-left"
      >
        {icon && <span className="text-gold shrink-0">{icon}</span>}
        <span className={`text-sm flex-1 truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {current?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180 text-gold" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-elegant overflow-hidden animate-fade-in">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-secondary/70 transition ${!value ? "text-gold" : "text-muted-foreground"}`}
          >
            <span className="italic">{placeholder}</span>
            {!value && <Check className="h-3.5 w-3.5" />}
          </button>
          <div className="h-px bg-border" />
          <ul className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-secondary/70 hover:text-gold transition ${value === opt.value ? "text-gold bg-secondary/40" : "text-foreground/90"}`}
                >
                  <span className="font-serif tracking-wide">{opt.label}</span>
                  {value === opt.value && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

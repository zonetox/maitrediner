import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import heroImg from "@/assets/hero-restaurant.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { Search, MapPin, Utensils, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

const CUISINES = ["Fine dining", "Omakase", "Steakhouse", "Pháp", "Ý", "Việt"];
const CITIES = ["TP.HCM", "Hà Nội", "Đà Nẵng"];

function LuxSelect({
  value, onChange, placeholder, options, icon,
}: { value: string; onChange: (v: string) => void; placeholder: string; options: string[]; icon: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition text-left"
      >
        <span className="text-gold shrink-0">{icon}</span>
        <span className={`text-sm flex-1 truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value || placeholder}
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
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-secondary/70 hover:text-gold transition ${value === opt ? "text-gold bg-secondary/40" : "text-foreground/90"}`}
                >
                  <span className="font-serif tracking-wide">{opt}</span>
                  {value === opt && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const SLIDES = [
  {
    img: heroImg,
    eyebrow: "Danh bạ ẩm thực cao cấp",
    title: "Khám phá những bàn tiệc",
    italic: "đáng nhớ nhất",
    suffix: "thành phố.",
    sub: "Từ omakase tinh tế, fine dining Pháp đến những steakhouse cổ điển — Maître quy tụ những nhà hàng được tuyển chọn kỹ lưỡng.",
  },
  {
    img: hero2,
    eyebrow: "Đêm rượu vang & nến",
    title: "Khoảnh khắc dành riêng cho",
    italic: "những dịp trọng đại",
    suffix: ".",
    sub: "Bàn tiệc thân mật, danh mục rượu vang tuyển chọn, và phục vụ chuẩn mực châu Âu — đặt chỗ chỉ trong vài phút.",
  },
  {
    img: hero3,
    eyebrow: "Omakase & Counter dining",
    title: "Nghệ thuật ẩm thực",
    italic: "trên đầu ngón tay",
    suffix: "đầu bếp.",
    sub: "Trải nghiệm những menu omakase được phục vụ trực tiếp bởi bếp trưởng, nguyên liệu chọn lọc mỗi sáng.",
  },
];

export function Hero() {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[idx];

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/restaurants",
      search: { q: q || undefined, cuisine: cuisine || undefined, city: city || undefined } as any,
    });
  }

  return (
    <section className="relative min-h-[100vh] flex items-end pb-20 overflow-hidden">
      {SLIDES.map((s, i) => (
        <img
          key={i}
          src={s.img}
          alt=""
          width={1920}
          height={1280}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1600ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: i === idx ? "scale(1.04)" : "scale(1)", transition: "opacity 1.6s ease, transform 8s ease" }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Slide controls */}
      <button
        onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Slide trước"
        className="hidden md:grid place-items-center absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-border bg-background/40 backdrop-blur hover:border-gold hover:text-gold transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        aria-label="Slide tiếp"
        className="hidden md:grid place-items-center absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-border bg-background/40 backdrop-blur hover:border-gold hover:text-gold transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <div className="max-w-3xl">
          <div key={idx} className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <span className="hairline w-12" />
              <span className="text-xs tracking-[0.3em] uppercase text-gold">{slide.eyebrow}</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-6">
              {slide.title} <span className="italic text-gradient-gold">{slide.italic}</span> {slide.suffix}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-10">{slide.sub}</p>
          </div>

          {/* Search */}
          <form onSubmit={onSearch} className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition">
                <Search className="h-4 w-4 text-gold shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tên nhà hàng, món ăn..."
                  className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
                />
              </div>
              <div className="border-l border-border">
                <LuxSelect
                  value={cuisine}
                  onChange={setCuisine}
                  placeholder="Loại nhà hàng"
                  options={CUISINES}
                  icon={<Utensils className="h-4 w-4" />}
                />
              </div>
              <div className="border-l border-border">
                <LuxSelect
                  value={city}
                  onChange={setCity}
                  placeholder="Địa điểm"
                  options={CITIES}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-gold text-primary-foreground font-medium px-8 py-3 rounded-xl hover:shadow-gold transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 mt-8">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-[2px] transition-all ${i === idx ? "w-12 bg-gold" : "w-6 bg-border hover:bg-gold-soft"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

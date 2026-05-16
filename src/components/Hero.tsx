import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import heroImg from "@/assets/hero-restaurant.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { Search, MapPin, Utensils, ChevronLeft, ChevronRight } from "lucide-react";

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
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition border-l border-border">
                <Utensils className="h-4 w-4 text-gold shrink-0" />
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="bg-transparent text-sm outline-none flex-1 text-muted-foreground appearance-none cursor-pointer"
                >
                  <option value="">Loại nhà hàng</option>
                  <option>Fine dining</option>
                  <option>Omakase</option>
                  <option>Steakhouse</option>
                  <option>Pháp</option>
                  <option>Ý</option>
                  <option>Việt</option>
                </select>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition border-l border-border">
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent text-sm outline-none flex-1 text-muted-foreground appearance-none cursor-pointer"
                >
                  <option value="">Địa điểm</option>
                  <option>TP.HCM</option>
                  <option>Hà Nội</option>
                  <option>Đà Nẵng</option>
                </select>
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

import { Sparkles, Clock, Tag } from "lucide-react";

const deals = [
  {
    badge: "Mới",
    title: "Tasting menu 7 món - Lumière",
    desc: "Giảm 25% cho đặt bàn từ Chủ nhật đến thứ Tư trong tháng này.",
    expire: "Hết hạn 30/11",
    tag: "-25%",
  },
  {
    badge: "Hot",
    title: "Omakase đôi - Hanami",
    desc: "Tặng kèm chai sake Junmai Daiginjo cho cặp đôi đặt bàn 19:00.",
    expire: "Hết hạn 15/12",
    tag: "Quà tặng",
  },
  {
    badge: "VIP",
    title: "Brunch cuối tuần - Maison Belle",
    desc: "Free flow champagne cho khách thân thiết Maître hạng Gold.",
    expire: "Cuối tuần",
    tag: "Free flow",
  },
];

export function Deals() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Ưu đãi độc quyền</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Dành riêng cho thành viên Maître</h2>
          </div>
          <button className="text-sm text-gold hover:underline">Tất cả ưu đãi →</button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {deals.map((d) => (
            <article key={d.title} className="relative p-8 rounded-2xl border border-border bg-card hover:border-gold transition-all overflow-hidden group">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-gold opacity-10 blur-2xl group-hover:opacity-20 transition" />
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">
                  {d.badge}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {d.expire}
                </span>
              </div>
              <Sparkles className="h-6 w-6 text-gold mb-4" />
              <h3 className="font-serif text-2xl leading-tight">{d.title}</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.desc}</p>
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <span className="flex items-center gap-2 text-gold font-medium">
                  <Tag className="h-4 w-4" /> {d.tag}
                </span>
                <button className="text-sm hover:text-gold transition">Lưu ưu đãi →</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

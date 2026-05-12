import { Wine, Fish, Beef, Croissant, Soup, Cake } from "lucide-react";

const cats = [
  { icon: Wine, name: "Fine dining", count: 86 },
  { icon: Fish, name: "Omakase", count: 24 },
  { icon: Beef, name: "Steakhouse / Diner", count: 41 },
  { icon: Croissant, name: "Bistro Pháp", count: 33 },
  { icon: Soup, name: "Á đương đại", count: 58 },
  { icon: Cake, name: "Patisserie", count: 19 },
];

export function Categories() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Phân loại</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Theo phong cách ẩm thực</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.map((c) => (
            <button
              key={c.name}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-gold transition-all text-left"
            >
              <c.icon className="h-7 w-7 text-gold mb-4 group-hover:scale-110 transition-transform" />
              <div className="font-serif text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.count} nhà hàng</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

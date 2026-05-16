import { Link } from "@tanstack/react-router";
import { Wine, Fish, Beef, Croissant, Soup, Cake } from "lucide-react";

const cats = [
  { icon: Wine, name: "Fine dining", q: "Fine dining" },
  { icon: Fish, name: "Omakase", q: "Omakase" },
  { icon: Beef, name: "Steakhouse", q: "Steakhouse" },
  { icon: Croissant, name: "Bistro Pháp", q: "Pháp" },
  { icon: Soup, name: "Á đương đại", q: "Việt" },
  { icon: Cake, name: "Patisserie", q: "Patisserie" },
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
            <Link
              key={c.name}
              to="/restaurants"
              search={{ cuisine: c.q } as any}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-gold transition-all text-left"
            >
              <c.icon className="h-7 w-7 text-gold mb-4 group-hover:scale-110 transition-transform" />
              <div className="font-serif text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1">Xem nhà hàng</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import d1 from "@/assets/dish-1.jpg";
import d2 from "@/assets/dish-2.jpg";
import d3 from "@/assets/dish-3.jpg";

const dishes = [
  { img: d1, name: "Wagyu A5 áp chảo", chef: "Lumière", desc: "Phần thăn ngoại Miyazaki, sốt rượu vang đỏ truffle." },
  { img: d2, name: "Omakase 12 món", chef: "Hanami Omakase", desc: "Cá nhập trực tiếp từ chợ Toyosu, Tokyo mỗi sáng." },
  { img: d3, name: "Sphère Chocolate Or", chef: "Maison Belle", desc: "Chocolate Valrhona 70%, vàng lá ăn được, kem vani Madagascar." },
];

export function SignatureDishes() {
  return (
    <section className="py-24 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Signature</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3">Món ăn đáng để đặt bàn</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {dishes.map((d, i) => (
            <article key={d.name} className="group">
              <div className="relative overflow-hidden rounded-2xl aspect-square mb-6">
                <img src={d.img} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute top-4 left-4 text-gold font-serif text-5xl opacity-30">0{i + 1}</div>
              </div>
              <h3 className="font-serif text-2xl">{d.name}</h3>
              <p className="text-xs uppercase tracking-wider text-gold mt-2">— {d.chef}</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

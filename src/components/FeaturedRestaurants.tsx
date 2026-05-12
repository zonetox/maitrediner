import r1 from "@/assets/restaurant-1.jpg";
import r2 from "@/assets/restaurant-2.jpg";
import r3 from "@/assets/restaurant-3.jpg";
import r4 from "@/assets/restaurant-4.jpg";
import { Star, MapPin, Heart } from "lucide-react";

const restaurants = [
  { img: r1, name: "Lumière", type: "Fine dining Pháp", area: "Quận 1, TP.HCM", rating: 4.9, price: "₫₫₫₫" },
  { img: r2, name: "Hanami Omakase", type: "Omakase Nhật", area: "Tây Hồ, Hà Nội", rating: 4.8, price: "₫₫₫₫" },
  { img: r3, name: "The Brass Diner", type: "American Steakhouse", area: "Quận 2, TP.HCM", rating: 4.7, price: "₫₫₫" },
  { img: r4, name: "Maison Belle", type: "Bistro châu Âu", area: "Hoàn Kiếm, Hà Nội", rating: 4.9, price: "₫₫₫₫" },
];

export function FeaturedRestaurants() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Tuyển chọn</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Nhà hàng nổi bật tuần này</h2>
          </div>
          <button className="text-sm text-gold hover:underline">Xem tất cả →</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((r) => (
            <article key={r.name} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-4">
                <img
                  src={r.img}
                  alt={r.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <button className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/60 backdrop-blur grid place-items-center hover:bg-gold hover:text-primary-foreground transition">
                  <Heart className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                  <span className="px-2 py-1 rounded-full bg-background/70 backdrop-blur text-foreground">
                    {r.price}
                  </span>
                  <span className="flex items-center gap-1 text-gold">
                    <Star className="h-3 w-3 fill-current" />
                    {r.rating}
                  </span>
                </div>
              </div>
              <h3 className="font-serif text-2xl group-hover:text-gold transition">{r.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{r.type}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {r.area}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

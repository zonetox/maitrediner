import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import r1 from "@/assets/restaurant-1.jpg";
import r2 from "@/assets/restaurant-2.jpg";
import r3 from "@/assets/restaurant-3.jpg";
import r4 from "@/assets/restaurant-4.jpg";
import { Star, MapPin, Heart, ArrowRight } from "lucide-react";
import { img } from "@/lib/img";

const FALLBACKS = [
  { img: r1, name: "Lumière", slug: "lumiere-demo", cuisine_type: "Fine dining Pháp", city: "Quận 1, TP.HCM", rating: 4.9, price_range: "₫₫₫₫", id: null as string | null, cover_image_url: r1 },
  { img: r2, name: "Hanami Omakase", slug: "hanami-demo", cuisine_type: "Omakase Nhật", city: "Tây Hồ, Hà Nội", rating: 4.8, price_range: "₫₫₫₫", id: null, cover_image_url: r2 },
  { img: r3, name: "The Brass Diner", slug: "brass-demo", cuisine_type: "American Steakhouse", city: "Quận 2, TP.HCM", rating: 4.7, price_range: "₫₫₫", id: null, cover_image_url: r3 },
  { img: r4, name: "Maison Belle", slug: "maison-demo", cuisine_type: "Bistro châu Âu", city: "Hoàn Kiếm, Hà Nội", rating: 4.9, price_range: "₫₫₫₫", id: null, cover_image_url: r4 },
];

export function FeaturedRestaurants() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>(FALLBACKS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, cuisine_type, city, address, rating, price_range, cover_image_url")
        .eq("is_published", true)
        .eq("is_featured", true)
        .limit(4);
      if (data && data.length > 0) setItems(data);
    })();
  }, []);

  async function fav(id: string | null) {
    if (!id) return toast.info("Đây là nhà hàng minh hoạ");
    if (!user) return toast.error("Vui lòng đăng nhập để lưu");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: id });
    if (error) toast.error(error.message); else toast.success("Đã lưu vào yêu thích");
  }

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Tuyển chọn</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Nhà hàng nổi bật tuần này</h2>
          </div>
          <Link to="/restaurants" className="text-sm text-gold hover:underline inline-flex items-center gap-2">
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((r) => (
            <article key={r.slug} className="group">
              <Link to="/r/$slug" params={{ slug: r.slug }} className="block">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-4 bg-secondary">
                  <img
                    src={r.cover_image_url ?? r.img}
                    alt={r.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <button
                    onClick={(e) => { e.preventDefault(); fav(r.id); }}
                    aria-label="Lưu yêu thích"
                    className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/60 backdrop-blur grid place-items-center hover:bg-gold hover:text-primary-foreground transition"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                    <span className="px-2 py-1 rounded-full bg-background/70 backdrop-blur text-foreground">
                      {r.price_range ?? "₫₫₫"}
                    </span>
                    {r.rating > 0 && (
                      <span className="flex items-center gap-1 text-gold">
                        <Star className="h-3 w-3 fill-current" />
                        {Number(r.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-serif text-2xl group-hover:text-gold transition">{r.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.cuisine_type}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {r.city}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star, MapPin, Heart, ArrowRight, Utensils } from "lucide-react";
import { img } from "@/lib/img";

type Item = {
  id: string;
  name: string;
  slug: string;
  cuisine_type: string | null;
  city: string | null;
  rating: number | null;
  price_range: string | null;
  cover_image_url: string | null;
  is_featured?: boolean;
};

export function FeaturedRestaurants() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, cuisine_type, city, rating, price_range, cover_image_url, is_featured")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(4);
      setItems((data ?? []) as Item[]);
    })();
  }, []);

  async function fav(id: string) {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: id });
    if (error) toast.error(error.message); else toast.success("Đã lưu vào yêu thích");
  }

  if (items === null) return null;
  if (items.length === 0) return null;

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Tuyển chọn</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Nhà hàng nổi bật</h2>
          </div>
          <Link to="/restaurants" className="text-sm text-gold hover:underline inline-flex items-center gap-2">
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((r) => (
            <article key={r.id} className="group">
              <Link to="/r/$slug" params={{ slug: r.slug }} className="block">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-4 bg-secondary">
                  {r.cover_image_url ? (
                    <img
                      src={img(r.cover_image_url, { w: 600, h: 750, q: 78 })}
                      alt={r.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground/40">
                      <Utensils className="h-10 w-10" />
                    </div>
                  )}
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
                    {r.rating != null && Number(r.rating) > 0 && (
                      <span className="flex items-center gap-1 text-gold">
                        <Star className="h-3 w-3 fill-current" />
                        {Number(r.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-serif text-2xl group-hover:text-gold transition">{r.name}</h3>
                {r.cuisine_type && <p className="text-sm text-muted-foreground mt-1">{r.cuisine_type}</p>}
                {r.city && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.city}
                  </p>
                )}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

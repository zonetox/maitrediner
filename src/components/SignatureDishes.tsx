import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star } from "lucide-react";
import { img as imgUrl } from "@/lib/img";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  restaurant_id: string;
  created_at: string;
  restaurants: { name: string; slug: string; cuisine_type: string | null } | null;
};

export function SignatureDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);

  useEffect(() => {
    (async () => {
      // Fetch all signature items from published+active restaurants
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, description, image_url, image_urls, restaurant_id, created_at, restaurants:restaurant_id (name, slug, cuisine_type, is_published, membership_status, trial_ends_at, membership_ends_at)")
        .eq("is_signature", true)
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .limit(60);
      const now = Date.now();
      const active = (data ?? []).filter((d: any) => {
        const r = d.restaurants;
        if (!r || !r.is_published) return false;
        if (r.membership_status === "trial") return r.trial_ends_at && new Date(r.trial_ends_at).getTime() > now;
        if (r.membership_status === "active") return !r.membership_ends_at || new Date(r.membership_ends_at).getTime() > now;
        return false;
      });
      // Keep newest 1 per restaurant
      const seen = new Set<string>();
      const dedup: Dish[] = [];
      for (const d of active) {
        if (seen.has(d.restaurant_id)) continue;
        seen.add(d.restaurant_id);
        dedup.push(d as Dish);
      }
      // Randomise then take 3
      const pool = dedup.slice(0, 12).sort(() => Math.random() - 0.5).slice(0, 3);
      setDishes(pool);
    })();
  }, []);

  if (dishes.length === 0) return null;

  return (
    <section className="py-24 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div className="text-center md:text-left">
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Signature</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Món ăn đáng để đặt bàn</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              Mỗi nhà hàng tinh tuyển một món signature — vị trí xoay vòng, ưu tiên những món vừa được cập nhật.
            </p>
          </div>
          <Link to="/signature" className="inline-flex items-center gap-2 text-sm text-gold hover:underline">
            Xem tất cả signature <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {dishes.map((d, i) => {
            const img = d.image_url || d.image_urls?.[0] || "";
            return (
              <Link
                key={d.id}
                to="/r/$slug"
                params={{ slug: d.restaurants?.slug ?? "" }}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-2xl aspect-square mb-6 bg-card border border-border">
                  {img ? (
                    <img src={img} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground/30">
                      <Star className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 text-gold font-serif text-5xl opacity-30">0{i + 1}</div>
                  <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider text-gold border border-gold/30">
                    <Star className="h-3 w-3 fill-gold" /> Signature
                  </div>
                </div>
                <h3 className="font-serif text-2xl group-hover:text-gold transition-colors">{d.name}</h3>
                <p className="text-xs uppercase tracking-wider text-gold mt-2">— {d.restaurants?.name}</p>
                {d.description && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">{d.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

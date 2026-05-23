import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Search, Star, Utensils } from "lucide-react";
import { LuxSelect } from "@/components/LuxSelect";

export const Route = createFileRoute("/signature")({
  head: () => ({
    meta: [
      { title: "Signature — Món ăn đáng để đặt bàn | Maison Dining" },
      { name: "description", content: "Bộ sưu tập món signature do các bếp trưởng tinh tuyển — mỗi nhà hàng một món đại diện." },
      { property: "og:title", content: "Signature — Món ăn đáng để đặt bàn" },
      { property: "og:description", content: "Khám phá những món signature đặc trưng từ các nhà hàng cao cấp." },
    ],
  }),
  component: SignaturePage,
});

type Dish = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  restaurant_id: string;
  created_at: string;
  price: number;
  restaurants: { name: string; slug: string; cuisine_type: string | null; city: string | null } | null;
};

function SignaturePage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [cuisinesList, setCuisinesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: items }, { data: cu }] = await Promise.all([
        supabase
          .from("menu_items")
          .select("id, name, description, image_url, image_urls, restaurant_id, created_at, price, restaurants:restaurant_id (name, slug, cuisine_type, city, is_published, membership_status, trial_ends_at, membership_ends_at)")
          .eq("is_signature", true)
          .eq("is_available", true)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase.from("cuisine_categories").select("name").eq("is_active", true).order("sort_order"),
      ]);
      const now = Date.now();
      const active = (items ?? []).filter((d: any) => {
        const r = d.restaurants;
        if (!r || !r.is_published) return false;
        if (r.membership_status === "trial") return r.trial_ends_at && new Date(r.trial_ends_at).getTime() > now;
        if (r.membership_status === "active") return !r.membership_ends_at || new Date(r.membership_ends_at).getTime() > now;
        return false;
      });
      // 1 newest per restaurant
      const seen = new Set<string>();
      const dedup: Dish[] = [];
      for (const d of active) {
        if (seen.has(d.restaurant_id)) continue;
        seen.add(d.restaurant_id);
        dedup.push(d as Dish);
      }
      setDishes(dedup);
      setCuisinesList((cu ?? []).map((c: any) => c.name));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return dishes.filter((d) => {
      if (needle && !(d.name.toLowerCase().includes(needle) || d.restaurants?.name.toLowerCase().includes(needle))) return false;
      if (cuisine && !(d.restaurants?.cuisine_type ?? "").toLowerCase().includes(cuisine.toLowerCase())) return false;
      return true;
    });
  }, [dishes, q, cuisine]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Signature collection</span>
          <h1 className="font-serif text-4xl md:text-6xl mt-3">Món ăn đáng để đặt bàn</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Mỗi nhà hàng tinh tuyển <strong className="text-foreground">một món signature</strong> để xuất hiện trong bộ sưu tập này.
            Lựa chọn được cập nhật bởi bếp trưởng và xoay vòng để bạn luôn khám phá điều mới.
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-2 mb-10 shadow-elegant">
          <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
              <Search className="h-4 w-4 text-gold shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm món signature, tên nhà hàng..."
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
              />
            </div>
            <div className="border-l border-border">
              <LuxSelect
                value={cuisine}
                onChange={setCuisine}
                placeholder="Loại nhà hàng"
                options={cuisinesList.map((c) => ({ label: c, value: c }))}
                icon={<Utensils className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-20">Đang tải…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Không có món signature nào khớp với tìm kiếm.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((d) => {
              const img = d.image_url || d.image_urls?.[0] || "";
              return (
                <Link
                  key={d.id}
                  to="/r/$slug"
                  params={{ slug: d.restaurants?.slug ?? "" }}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-2xl aspect-square mb-5 bg-card border border-border">
                    {img ? (
                      <img src={img} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground/30">
                        <Star className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider text-gold border border-gold/30">
                      <Star className="h-3 w-3 fill-gold" /> Signature
                    </div>
                  </div>
                  <h3 className="font-serif text-xl group-hover:text-gold transition-colors">{d.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-gold mt-2">— {d.restaurants?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.restaurants?.cuisine_type ?? "—"} {d.restaurants?.city ? `· ${d.restaurants.city}` : ""}
                  </p>
                  {d.description && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{d.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

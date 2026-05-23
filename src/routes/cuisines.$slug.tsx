import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MapPin, Utensils, Star, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/cuisines/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("cuisine_categories")
      .select("id, name, slug, icon, is_active")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data || !data.is_active) throw notFound();
    return { category: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? "Phong cách"} — Nhà hàng | Maison Dining` },
      { name: "description", content: `Khám phá các nhà hàng phong cách ${loaderData?.category.name} trên Maison Dining — không phân biệt địa điểm.` },
      { property: "og:title", content: `${loaderData?.category.name ?? "Phong cách"} — Nhà hàng | Maison Dining` },
      { property: "og:description", content: `Khám phá các nhà hàng phong cách ${loaderData?.category.name} trên Maison Dining.` },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-32 max-w-2xl mx-auto px-6 text-center text-muted-foreground">
        Có lỗi xảy ra: {error.message}
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-32 max-w-2xl mx-auto px-6 text-center">
        <h1 className="font-serif text-3xl mb-3">Không tìm thấy phong cách</h1>
        <Link to="/restaurants" className="text-gold hover:underline">← Xem tất cả nhà hàng</Link>
      </div>
    </div>
  ),
  component: CuisinePage,
});

function CuisinePage() {
  const { category } = Route.useLoaderData();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_published", true)
        .ilike("cuisine_type", `%${category.name}%`)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [category.name]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        <Link to="/restaurants" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-gold mb-6">
          <ArrowLeft className="h-3 w-3" /> Tất cả nhà hàng
        </Link>
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Phong cách ẩm thực</span>
          <h1 className="font-serif text-4xl md:text-6xl mt-3">{category.name}</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Tất cả nhà hàng phong cách <strong className="text-foreground">{category.name}</strong> trên Maison Dining — không phân biệt địa điểm.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-20">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Chưa có nhà hàng nào trong phong cách này.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((r) => (
              <article key={r.id} className="group">
                <Link to="/r/$slug" params={{ slug: r.slug }} className="block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-4 bg-secondary">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-gold/30">
                        <Utensils className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                      <span className="px-2 py-1 rounded-full bg-background/70 backdrop-blur">{r.price_range ?? "₫₫₫"}</span>
                      {r.rating > 0 && (
                        <span className="flex items-center gap-1 text-gold">
                          <Star className="h-3 w-3 fill-current" />
                          {Number(r.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl group-hover:text-gold transition">{r.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.cuisine_type ?? "Ẩm thực cao cấp"}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.city ?? "Việt Nam"}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MapPin, Utensils, Star, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { img } from "@/lib/img";

type SortKey = "popular" | "rating" | "newest";
const PAGE_SIZE = 12;

type SearchParams = { sort?: SortKey; page?: number };

export const Route = createFileRoute("/cuisines/$slug")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    sort: (["popular", "rating", "newest"].includes(s.sort as string) ? s.sort : "popular") as SortKey,
    page: Math.max(1, Number(s.page) || 1),
  }),
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
      { name: "description", content: `Khám phá các nhà hàng phong cách ${loaderData?.category.name} trên Maison Dining.` },
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
  const { sort = "popular", page = 1 } = Route.useSearch();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("restaurants")
        .select("*", { count: "exact" })
        .eq("is_published", true)
        .ilike("cuisine_type", `%${category.name}%`);
      if (sort === "popular") {
        q = q.order("is_featured", { ascending: false }).order("rating", { ascending: false });
      } else if (sort === "rating") {
        q = q.order("rating", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }
      const { data, count } = await q.range(from, to);
      setItems(data ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    })();
  }, [category.name, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function setSort(s: SortKey) {
    navigate({ to: "/cuisines/$slug", params: { slug: category.slug }, search: { sort: s, page: 1 } as any });
  }
  function setPage(p: number) {
    navigate({ to: "/cuisines/$slug", params: { slug: category.slug }, search: { sort, page: p } as any });
  }

  const sorts: { key: SortKey; label: string }[] = [
    { key: "popular", label: "Phổ biến" },
    { key: "rating", label: "Đánh giá" },
    { key: "newest", label: "Mới nhất" },
  ];

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
            Tất cả nhà hàng phong cách <strong className="text-foreground">{category.name}</strong> trên Maison Dining.
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <span className="text-sm text-muted-foreground">{total} nhà hàng</span>
          <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-card/60">
            {sorts.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`px-4 py-1.5 rounded-full text-xs tracking-wide transition ${sort === s.key ? "bg-gradient-gold text-primary-foreground shadow-gold" : "text-muted-foreground hover:text-gold"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-20">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Chưa có nhà hàng nào trong phong cách này.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((r) => (
                <article key={r.id} className="group">
                  <Link to="/r/$slug" params={{ slug: r.slug }} className="block">
                    <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-4 bg-secondary">
                      {r.cover_image_url ? (
                        <img src={img(r.cover_image_url, { w: 600, h: 750, q: 78 })} alt={r.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground">…</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`h-9 min-w-9 px-3 rounded-full text-sm transition ${p === page ? "bg-gradient-gold text-primary-foreground shadow-gold" : "border border-border text-muted-foreground hover:text-gold hover:border-gold"}`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

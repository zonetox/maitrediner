import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LuxSelect } from "@/components/LuxSelect";
import { Search, MapPin, Utensils, Star, Heart, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type SearchParams = { q?: string; cuisine?: string; city?: string; amenities?: string };

export const Route = createFileRoute("/restaurants")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cuisine: typeof s.cuisine === "string" ? s.cuisine : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
    amenities: typeof s.amenities === "string" ? s.amenities : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Nhà hàng cao cấp — Maître" },
      { name: "description", content: "Tìm kiếm và khám phá các nhà hàng cao cấp, fine dining, omakase trên Maître." },
    ],
  }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  const params = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.q ?? "");
  const [cuisine, setCuisine] = useState(params.cuisine ?? "");
  const [city, setCity] = useState(params.city ?? "");
  const [amenities, setAmenities] = useState<string[]>(
    params.amenities ? params.amenities.split(",").filter(Boolean) : [],
  );

  const [cuisinesList, setCuisinesList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: cu }, { data: lo }, { data: am }, { data: rs }] = await Promise.all([
        supabase.from("cuisine_categories").select("name").eq("is_active", true).order("sort_order"),
        supabase.from("locations").select("name").eq("is_active", true).order("sort_order"),
        supabase.from("amenities").select("name").eq("is_active", true).order("sort_order"),
        supabase.from("restaurants").select("amenities").eq("is_published", true),
      ]);
      setCuisinesList(cu?.map((c: any) => c.name) ?? []);
      setCitiesList(lo?.map((c: any) => c.name) ?? []);
      const set = new Set<string>((am ?? []).map((a: any) => a.name));
      (rs ?? []).forEach((r: any) => (r.amenities || []).forEach((a: string) => a && set.add(a)));
      setAmenitiesList(Array.from(set));
    })();
  }, []);


  useEffect(() => {
    setQ(params.q ?? "");
    setCuisine(params.cuisine ?? "");
    setCity(params.city ?? "");
    setAmenities(params.amenities ? params.amenities.split(",").filter(Boolean) : []);
  }, [params.q, params.cuisine, params.city, params.amenities]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("restaurants").select("*").eq("is_published", true);
      if (params.q) query = query.ilike("name", `%${params.q}%`);
      if (params.cuisine) query = query.ilike("cuisine_type", `%${params.cuisine}%`);
      if (params.city) query = query.ilike("city", `%${params.city}%`);
      if (params.amenities) {
        const arr = params.amenities.split(",").filter(Boolean);
        if (arr.length) query = query.contains("amenities", arr);
      }
      const { data } = await query.order("is_featured", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [params.q, params.cuisine, params.city, params.amenities]);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    navigate({
      to: "/restaurants",
      search: {
        q: q || undefined,
        cuisine: cuisine || undefined,
        city: city || undefined,
        amenities: amenities.length ? amenities.join(",") : undefined,
      } as any,
    });
  }

  function toggleAmenity(a: string) {
    setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  function clearAll() {
    setQ(""); setCuisine(""); setCity(""); setAmenities([]);
    navigate({ to: "/restaurants", search: {} as any });
  }

  async function fav(id: string) {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: id });
    if (error) toast.error(error.message);
    else toast.success("Đã lưu vào yêu thích");
  }

  const hasFilters = !!(params.q || params.cuisine || params.city || params.amenities);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Danh bạ</span>
              <h1 className="font-serif text-4xl md:text-5xl mt-3">Nhà hàng tuyển chọn</h1>
            </div>
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gold" /> {items.length} kết quả
            </span>
          </div>

          <form onSubmit={apply} className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-2 mb-4 grid md:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 shadow-elegant">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-4 w-4 text-gold" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên nhà hàng..." className="bg-transparent outline-none text-sm flex-1" />
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
            <div className="border-l border-border">
              <LuxSelect
                value={city}
                onChange={setCity}
                placeholder="Địa điểm"
                options={citiesList.map((c) => ({ label: c, value: c }))}
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>
            <button className="bg-gradient-gold text-primary-foreground rounded-xl px-8 font-medium">Lọc</button>
          </form>

          {amenitiesList.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Tiện ích</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map((a) => {
                  const active = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { toggleAmenity(a); setTimeout(() => apply(), 0); }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-serif tracking-wide border transition ${active ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
                    >
                      {a}
                    </button>
                  );
                })}
                {hasFilters && (
                  <button type="button" onClick={clearAll}
                    className="px-3.5 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition inline-flex items-center gap-1">
                    <X className="h-3 w-3" /> Xoá bộ lọc
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground text-center py-20">Đang tải...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl">
              <Search className="h-8 w-8 text-gold mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Không có nhà hàng phù hợp.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <button
                        onClick={(e) => { e.preventDefault(); fav(r.id); }}
                        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/60 backdrop-blur grid place-items-center hover:bg-gold hover:text-primary-foreground transition"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
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
                      <MapPin className="h-3 w-3" /> {r.address ? `${r.address}, ` : ""}{r.city ?? "Việt Nam"}
                    </p>
                    {Array.isArray(r.amenities) && r.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {r.amenities.slice(0, 3).map((a: string) => (
                          <span key={a} className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">{a}</span>
                        ))}
                        {r.amenities.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{r.amenities.length - 3}</span>
                        )}
                      </div>
                    )}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { notify } from "@/lib/notify.functions";
import {
  MapPin, Phone, Clock, Heart, Calendar, Sparkles, Mail,
  Utensils, Wine, ChefHat, Star, ArrowRight, X, ChevronLeft, ChevronRight, Tag, Bookmark,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/r/$slug")({
  component: RestaurantPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Maître` },
      { name: "description", content: "Trải nghiệm ẩm thực tinh tế tại nhà hàng được tuyển chọn trên Maître." },
    ],
  }),
});

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200",
  "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=1200",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
];

function RestaurantPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [r, setR] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [dish, setDish] = useState<any | null>(null);
  const [deal, setDeal] = useState<any | null>(null);
  const [lightbox, setLightbox] = useState<{ list: string[]; index: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
      setR(data);
      if (data) {
        const [{ data: m }, { data: d }, { data: cats }] = await Promise.all([
          supabase.from("menu_items").select("*").eq("restaurant_id", data.id).eq("is_available", true).order("sort_order"),
          supabase.from("deals").select("*").eq("restaurant_id", data.id).eq("is_active", true),
          supabase.from("menu_categories").select("*").eq("restaurant_id", data.id).order("sort_order"),
        ]);
        setMenu(m ?? []); setDeals(d ?? []); setCategories(cats ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  async function addFavorite() {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu yêu thích");
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("restaurant_id", r.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
      return toast.success("Đã bỏ khỏi yêu thích");
    }
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: r.id });
    if (error) toast.error(error.message); else toast.success("Đã lưu vào yêu thích");
  }

  async function saveDeal(id: string) {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu ưu đãi");
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("deal_id", id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
      return toast.success("Đã bỏ ưu đãi khỏi yêu thích");
    }
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, deal_id: id });
    if (error) toast.error(error.message); else toast.success("Đã lưu ưu đãi");
  }

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!r) return (
    <div className="min-h-screen bg-background grid place-items-center">
      <div className="text-center">
        <p className="text-muted-foreground">Không tìm thấy nhà hàng</p>
      </div>
    </div>
  );

  const lc = r.landing_content || {};
  const cover = r.cover_image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920";
  const gallery: string[] = lc.gallery?.length ? lc.gallery : FALLBACK_GALLERY;
  const signatures = menu.filter((m) => m.is_signature).slice(0, 3);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name || "À la carte";
  const menuByCat = menu.reduce<Record<string, any[]>>((acc, m) => {
    const k = catName(m.category_id);
    (acc[k] ??= []).push(m);
    return acc;
  }, {});

  const hoursList: { day: string; time: string }[] = lc.hours_list ?? [
    { day: "Thứ 2 – Thứ 5", time: "11:30 – 14:30 · 18:00 – 22:30" },
    { day: "Thứ 6 – Thứ 7", time: "11:30 – 15:00 · 18:00 – 23:30" },
    { day: "Chủ nhật", time: "11:00 – 15:00 · 18:00 – 22:00" },
  ];

  function openImage(list: string[], index: number) { setLightbox({ list, index }); }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative min-h-[92vh] flex items-end pb-20 overflow-hidden">
          <img src={cover} alt={r.name} className="absolute inset-0 w-full h-full object-cover scale-105 cursor-zoom-in"
            onClick={() => openImage([cover, ...gallery], 0)} />
          <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-6 w-full">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-gold" />
              <span className="text-xs tracking-[0.3em] uppercase text-gold">{r.cuisine_type || "Fine dining"}</span>
              {r.is_featured && (
                <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">
                  Maître's Pick
                </span>
              )}
            </div>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl max-w-4xl leading-[1.05]">{r.name}</h1>
            {lc.hero_tagline && (
              <p className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-2xl italic font-serif">
                "{lc.hero_tagline}"
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-10 text-sm">
              {(r.address || r.city) && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold" /> {r.address || r.city}
                </span>
              )}
              {r.phone && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-gold" /> {r.phone}
                </span>
              )}
              {r.price_range && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Wine className="h-4 w-4 text-gold" /> {r.price_range}
                </span>
              )}
              {r.rating > 0 && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4 text-gold fill-gold" /> {Number(r.rating).toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-10">
              <button onClick={() => setShowBook(true)}
                className="px-8 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Đặt chỗ ngay
              </button>
              <a href="#menu" className="px-8 py-4 rounded-full border border-gold text-gold hover:bg-gold/10 transition">
                Xem thực đơn
              </a>
              {r.phone && (
                <a href={`tel:${r.phone}`} className="px-8 py-4 rounded-full border border-border hover:border-gold transition flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Gọi nhà hàng
                </a>
              )}
              <button onClick={addFavorite} className="px-8 py-4 rounded-full border border-border hover:border-gold flex items-center gap-2 transition">
                <Heart className="h-4 w-4" /> Lưu
              </button>
            </div>
          </div>
        </section>

        {/* STORY */}
        {(lc.story || lc.chef_name) && (
          <section className="py-28 border-t border-border">
            <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-xs tracking-[0.3em] uppercase text-gold">Câu chuyện</span>
                <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-tight">
                  {lc.story_title || "Triết lý ẩm thực"}
                </h2>
                <div className="hairline w-32 my-8" />
                <p className="text-muted-foreground leading-loose text-lg font-serif italic whitespace-pre-line">
                  {lc.story || "Mỗi món ăn là một bản hòa tấu của hương vị, nguyên liệu tuyển chọn và bàn tay của người đầu bếp tận tâm."}
                </p>
                {lc.chef_name && (
                  <div className="flex items-center gap-4 mt-10 pt-8 border-t border-border">
                    <div className="h-12 w-12 rounded-full bg-gradient-gold grid place-items-center">
                      <ChefHat className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-serif text-xl">{lc.chef_name}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                        {lc.chef_title || "Bếp trưởng điều hành"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl cursor-zoom-in"
                onClick={() => openImage(gallery, 0)}>
                <img src={gallery[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              </div>
            </div>
          </section>
        )}

        {/* SIGNATURES */}
        {signatures.length > 0 && (
          <section className="py-24 border-t border-border bg-secondary/20">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center mb-16">
                <span className="text-xs tracking-[0.3em] uppercase text-gold">Signature</span>
                <h2 className="font-serif text-4xl md:text-5xl mt-3">Món signature của bếp trưởng</h2>
                <p className="text-sm text-muted-foreground mt-3">Bấm vào món để xem chi tiết</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {signatures.map((s, i) => (
                  <button type="button" key={s.id} onClick={() => setDish(s)}
                    className="group text-left">
                    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-card">
                      <img
                        src={s.image_url || gallery[(i + 1) % gallery.length]}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-2xl group-hover:text-gold transition">{s.name}</h3>
                        {s.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                      </div>
                      <div className="text-gold font-serif text-xl whitespace-nowrap">
                        {Number(s.price).toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* DEALS */}
        {deals.length > 0 && (
          <section className="py-24 border-t border-border">
            <div className="mx-auto max-w-7xl px-6">
              <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
                <div>
                  <span className="text-xs tracking-[0.3em] uppercase text-gold">Ưu đãi</span>
                  <h2 className="font-serif text-4xl md:text-5xl mt-3 flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-gold" /> Đang diễn ra
                  </h2>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {deals.map((d) => (
                  <button type="button" key={d.id} onClick={() => setDeal(d)}
                    className="relative text-left p-8 rounded-2xl bg-card border border-border hover:border-gold transition group overflow-hidden">
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-gold opacity-10 blur-2xl group-hover:opacity-20 transition" />
                    {d.badge && (
                      <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">
                        {d.badge}
                      </span>
                    )}
                    <h3 className="font-serif text-2xl mt-4 group-hover:text-gold transition">{d.title}</h3>
                    {d.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">{d.description}</p>}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-xs">
                      {d.expires_at ? (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(d.expires_at).toLocaleDateString("vi-VN")}
                        </span>
                      ) : <span />}
                      <span className="text-gold inline-flex items-center gap-1">Chi tiết <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* MENU */}
        <section id="menu" className="py-28 border-t border-border">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-16">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Thực đơn</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3 flex items-center justify-center gap-3">
                <Utensils className="h-7 w-7 text-gold" /> À la carte
              </h2>
              <div className="hairline w-40 mx-auto mt-8" />
              <p className="text-sm text-muted-foreground mt-4">Bấm vào từng món để xem chi tiết và hình ảnh</p>
            </div>
            {menu.length === 0 ? (
              <p className="text-center text-muted-foreground italic">Đang cập nhật thực đơn...</p>
            ) : (
              <div className="space-y-16">
                {Object.entries(menuByCat).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="font-serif text-2xl text-gold mb-6 tracking-wide">{cat}</h3>
                    <div className="space-y-2">
                      {items.map((m) => {
                        const imgs: string[] = (m.image_urls?.length ? m.image_urls : (m.image_url ? [m.image_url] : []));
                        return (
                          <button type="button" key={m.id} onClick={() => setDish(m)}
                            className="w-full text-left grid md:grid-cols-[80px_1fr_auto] gap-5 items-center p-4 rounded-xl hover:bg-secondary/40 border border-transparent hover:border-border transition group">
                            {imgs[0] ? (
                              <div className="hidden md:block w-20 h-20 rounded-lg overflow-hidden bg-card">
                                <img src={imgs[0]} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              </div>
                            ) : <div className="hidden md:block w-20 h-20 rounded-lg bg-secondary/40 grid place-items-center"><Utensils className="h-5 w-5 text-muted-foreground" /></div>}
                            <div className="min-w-0">
                              <h4 className="font-serif text-xl flex items-center gap-2 flex-wrap group-hover:text-gold transition">
                                {m.name}
                                {m.is_signature && (
                                  <span className="text-[10px] uppercase tracking-widest text-gold border border-gold px-2 py-0.5 rounded-full">
                                    Signature
                                  </span>
                                )}
                              </h4>
                              {m.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{m.description}</p>}
                            </div>
                            <div className="text-gold font-serif text-xl whitespace-nowrap text-right">
                              {Number(m.price).toLocaleString("vi-VN")}₫
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* GALLERY */}
        <section className="py-24 border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-12">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Không gian</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">Trải nghiệm thị giác</h2>
              <p className="text-sm text-muted-foreground mt-3">Bấm vào hình để phóng to</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {gallery.slice(0, 6).map((src, i) => (
                <button type="button" key={i} onClick={() => openImage(gallery, i)}
                  className={`overflow-hidden rounded-xl cursor-zoom-in ${i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-square"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* HOURS + CONTACT */}
        <section className="py-24 border-t border-border">
          <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-12">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Giờ phục vụ</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-3 flex items-center gap-3">
                <Clock className="h-6 w-6 text-gold" /> Lịch mở cửa
              </h2>
              <div className="mt-8 space-y-4">
                {hoursList.map((h) => (
                  <div key={h.day} className="flex justify-between gap-4 py-3 border-b border-border">
                    <span className="font-serif text-lg">{h.day}</span>
                    <span className="text-muted-foreground text-sm">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Liên hệ</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-3">Đặt bàn & thắc mắc</h2>
              <div className="mt-8 space-y-5">
                {r.address && (
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="font-serif text-lg">Địa chỉ</p>
                      <p className="text-sm text-muted-foreground mt-1">{r.address}{r.city ? `, ${r.city}` : ""}</p>
                    </div>
                  </div>
                )}
                {r.phone && (
                  <div className="flex gap-4">
                    <Phone className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="font-serif text-lg">Điện thoại</p>
                      <a href={`tel:${r.phone}`} className="text-sm text-muted-foreground hover:text-gold mt-1 block">{r.phone}</a>
                    </div>
                  </div>
                )}
                {r.email && (
                  <div className="flex gap-4">
                    <Mail className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="font-serif text-lg">Email</p>
                      <a href={`mailto:${r.email}`} className="text-sm text-muted-foreground hover:text-gold mt-1 block">{r.email}</a>
                    </div>
                  </div>
                )}
                <button onClick={() => setShowBook(true)}
                  className="mt-6 w-full px-6 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition flex items-center justify-center gap-2">
                  Đặt chỗ ngay <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />

      {/* Sticky reserve bar - mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border p-4 flex gap-2">
        <button onClick={() => setShowBook(true)}
          className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium flex items-center justify-center gap-2">
          <Calendar className="h-4 w-4" /> Đặt chỗ ngay
        </button>
        {r.phone && (
          <a href={`tel:${r.phone}`} className="px-5 py-3 rounded-full border border-gold text-gold font-medium flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>

      {showBook && <BookingModal r={r} onClose={() => setShowBook(false)} user={user} />}
      {dish && <DishModal dish={dish} fallback={gallery} onClose={() => setDish(null)} onBook={() => { setDish(null); setShowBook(true); }} onZoom={(list, idx) => openImage(list, idx)} />}
      {deal && <DealModal deal={deal} onClose={() => setDeal(null)} onBook={() => { setDeal(null); setShowBook(true); }} onSave={() => saveDeal(deal.id)} />}
      {lightbox && <Lightbox list={lightbox.list} index={lightbox.index} onClose={() => setLightbox(null)} onIndex={(i) => setLightbox({ ...lightbox, index: i })} />}
    </div>
  );
}

function DishModal({ dish, fallback, onClose, onBook, onZoom }: { dish: any; fallback: string[]; onClose: () => void; onBook: () => void; onZoom: (list: string[], i: number) => void }) {
  const imgs: string[] = (dish.image_urls?.length ? dish.image_urls : (dish.image_url ? [dish.image_url] : [])).filter(Boolean);
  const display = imgs.length ? imgs : [fallback[0]];
  const [active, setActive] = useState(0);
  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur overflow-y-auto" onClick={onClose}>
      <div className="min-h-full grid place-items-center p-4">
        <div onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl max-w-3xl w-full shadow-elegant overflow-hidden relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 h-9 w-9 grid place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-gold hover:text-primary-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="grid md:grid-cols-2">
            <div className="bg-secondary/40">
              <button type="button" onClick={() => onZoom(display, active)} className="block w-full aspect-square overflow-hidden cursor-zoom-in">
                <img src={display[active]} alt={dish.name} className="w-full h-full object-cover hover:scale-105 transition" />
              </button>
              {display.length > 1 && (
                <div className="grid grid-cols-4 gap-1 p-1">
                  {display.slice(0, 4).map((src, i) => (
                    <button key={i} type="button" onClick={() => setActive(i)}
                      className={`aspect-square overflow-hidden rounded ${i === active ? "ring-2 ring-gold" : "opacity-70 hover:opacity-100"}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                {dish.is_signature && (
                  <span className="text-[10px] uppercase tracking-widest text-gold border border-gold px-2 py-0.5 rounded-full">Signature</span>
                )}
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">À la carte</span>
              </div>
              <h3 className="font-serif text-3xl leading-tight">{dish.name}</h3>
              <div className="text-gold font-serif text-2xl mt-2">{Number(dish.price).toLocaleString("vi-VN")}₫</div>
              {dish.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">{dish.description}</p>
              )}
              <div className="mt-auto pt-6 flex gap-2">
                <button onClick={onBook}
                  className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" /> Đặt chỗ để thưởng thức
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 text-center italic">
                Maître là kênh giới thiệu — giao dịch & thanh toán thực hiện trực tiếp tại nhà hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealModal({ deal, onClose, onBook, onSave }: { deal: any; onClose: () => void; onBook: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur overflow-y-auto" onClick={onClose}>
      <div className="min-h-full grid place-items-center p-4">
        <div onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full shadow-elegant relative">
          <button onClick={onClose} className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
          <Sparkles className="h-8 w-8 text-gold mb-4" />
          <div className="flex items-center gap-2 mb-3">
            {deal.badge && (
              <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">{deal.badge}</span>
            )}
            {deal.tag && (
              <span className="flex items-center gap-1 text-xs text-gold"><Tag className="h-3 w-3" /> {deal.tag}</span>
            )}
          </div>
          <h3 className="font-serif text-3xl leading-tight">{deal.title}</h3>
          {deal.description && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">{deal.description}</p>
          )}
          {deal.expires_at && (
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Hết hạn {new Date(deal.expires_at).toLocaleDateString("vi-VN")}
            </p>
          )}
          <div className="mt-6 p-4 rounded-xl bg-background/60 border border-border text-xs text-muted-foreground leading-relaxed">
            Trình màn hình ưu đãi này tại nhà hàng khi đặt chỗ để được áp dụng. Mỗi ưu đãi có thể đi kèm điều kiện riêng từ nhà hàng.
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={onSave} className="flex-1 py-3 rounded-full border border-gold text-gold hover:bg-gold/10 transition flex items-center justify-center gap-2">
              <Bookmark className="h-4 w-4" /> Lưu ưu đãi
            </button>
            <button onClick={onBook} className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" /> Đặt chỗ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ list, index, onClose, onIndex }: { list: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const prev = () => onIndex((index - 1 + list.length) % list.length);
  const next = () => onIndex((index + 1) % list.length);
  return (
    <div className="fixed inset-0 z-[70] bg-black/95 grid place-items-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white">
        <X className="h-5 w-5" />
      </button>
      {list.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <img src={list[index]} alt="" onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg" />
      {list.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-widest">
          {index + 1} / {list.length}
        </div>
      )}
    </div>
  );
}

function BookingModal({ r, onClose, user }: any) {
  const notifyFn = useServerFn(notify);
  const [form, setForm] = useState({
    guest_name: "", guest_phone: "", guest_email: user?.email ?? "",
    party_size: 2, booking_at: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const { data: row, error } = await supabase.from("bookings").insert({
      restaurant_id: r.id, user_id: user?.id ?? null,
      guest_name: form.guest_name, guest_phone: form.guest_phone, guest_email: form.guest_email,
      party_size: form.party_size, booking_at: form.booking_at, notes: form.notes,
    }).select().single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Đã gửi yêu cầu đặt chỗ. Nhà hàng sẽ liên hệ xác nhận.");
    if (row) notifyFn({ data: { type: "booking", restaurantId: r.id, recordId: row.id } }).catch(() => {});
    onClose();
  }
  return (
    <div className="fixed inset-0 z-[80] bg-background/85 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-elegant my-8">
        <span className="text-xs tracking-[0.3em] uppercase text-gold">Reservation</span>
        <h3 className="font-serif text-3xl mt-2 mb-1">Đặt chỗ tại {r.name}</h3>
        <p className="text-sm text-muted-foreground mb-6">Nhà hàng sẽ liên hệ để xác nhận trong vòng 30 phút.</p>
        <div className="space-y-3">
          <input required placeholder="Họ tên" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
          <input required placeholder="Số điện thoại" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
          <input type="email" placeholder="Email (tùy chọn)" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="datetime-local" value={form.booking_at} onChange={(e) => setForm({ ...form, booking_at: e.target.value })}
              className="px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
            <input required type="number" min={1} placeholder="Số khách" value={form.party_size} onChange={(e) => setForm({ ...form, party_size: +e.target.value })}
              className="px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
          </div>
          <textarea placeholder="Yêu cầu đặc biệt (sinh nhật, kỷ niệm, dị ứng, ưu đãi áp dụng...)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 italic text-center">
          Maître chỉ giới thiệu nhà hàng — không xử lý thanh toán. Thanh toán diễn ra trực tiếp giữa khách và nhà hàng.
        </p>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:border-gold transition">Hủy</button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition">
            {submitting ? "Đang gửi..." : <span className="flex items-center justify-center gap-2"><Calendar className="h-4 w-4" /> Xác nhận</span>}
          </button>
        </div>
      </form>
    </div>
  );
}

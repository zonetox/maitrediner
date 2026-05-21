import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  MapPin, Phone, Clock, Heart, Calendar, Sparkles, Mail,
  Utensils, Wine, ChefHat, Star, ArrowRight, ShoppingBag, Plus, Minus, Trash2,
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
  const [showOrder, setShowOrder] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  function addToCart(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    toast.success("Đã thêm vào giỏ");
  }
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

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
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: r.id });
    if (error) toast.error(error.message); else toast.success("Đã lưu vào yêu thích");
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative min-h-[92vh] flex items-end pb-20 overflow-hidden">
          <img src={cover} alt={r.name} className="absolute inset-0 w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
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
              <button onClick={() => setShowOrder(true)}
                className="px-8 py-4 rounded-full border border-gold text-gold hover:bg-gold/10 transition flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Đặt món
                {cartCount > 0 && <span className="ml-1 h-5 min-w-5 px-1.5 grid place-items-center rounded-full bg-gradient-gold text-primary-foreground text-xs">{cartCount}</span>}
              </button>
              <a href="#menu" className="px-8 py-4 rounded-full border border-border hover:border-gold transition">
                Xem thực đơn
              </a>
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
                <p className="text-muted-foreground leading-loose text-lg font-serif italic">
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
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
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
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {signatures.map((s, i) => (
                  <article key={s.id} className="group">
                    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-card">
                      <img
                        src={s.image_url || gallery[(i + 1) % gallery.length]}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-2xl">{s.name}</h3>
                        {s.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                      </div>
                      <div className="text-gold font-serif text-xl whitespace-nowrap">
                        {Number(s.price).toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  </article>
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
                  <div key={d.id} className="relative p-8 rounded-2xl bg-card border border-border hover:border-gold transition group overflow-hidden">
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-gold opacity-10 blur-2xl group-hover:opacity-20 transition" />
                    {d.badge && (
                      <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">
                        {d.badge}
                      </span>
                    )}
                    <h3 className="font-serif text-2xl mt-4">{d.title}</h3>
                    {d.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.description}</p>}
                    {d.expires_at && (
                      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Hết hạn {new Date(d.expires_at).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
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
            </div>
            {menu.length === 0 ? (
              <p className="text-center text-muted-foreground italic">Đang cập nhật thực đơn...</p>
            ) : (
              <div className="space-y-16">
                {Object.entries(menuByCat).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="font-serif text-2xl text-gold mb-6 tracking-wide">{cat}</h3>
                    <div className="space-y-8">
                      {items.map((m) => {
                        const imgs: string[] = (m.image_urls?.length ? m.image_urls : (m.image_url ? [m.image_url] : []));
                        return (
                          <div key={m.id} className="grid md:grid-cols-[1fr_auto] gap-6 py-5 border-b border-border/60">
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-4">
                                <h4 className="font-serif text-xl flex items-center gap-2 flex-wrap">
                                  {m.name}
                                  {m.is_signature && (
                                    <span className="text-[10px] uppercase tracking-widest text-gold border border-gold px-2 py-0.5 rounded-full">
                                      Signature
                                    </span>
                                  )}
                                </h4>
                                <div className="text-gold font-serif text-xl whitespace-nowrap">
                                  {Number(m.price).toLocaleString("vi-VN")}₫
                                </div>
                              </div>
                              {m.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{m.description}</p>}
                              {imgs.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-4 max-w-sm">
                                  {imgs.slice(0, 3).map((src, i) => (
                                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-card">
                                      <img src={src} alt={m.name} className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button onClick={() => addToCart(m.id)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/60 text-gold text-xs hover:bg-gold/10 transition">
                                <Plus className="h-3 w-3" /> Thêm vào giỏ
                              </button>
                            </div>
                          </div>
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
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {gallery.slice(0, 6).map((src, i) => (
                <div key={i} className={`overflow-hidden rounded-xl ${i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-square"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                </div>
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

      {/* Sticky reserve bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border p-4 flex gap-2">
        <button onClick={() => setShowBook(true)}
          className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium flex items-center justify-center gap-2">
          <Calendar className="h-4 w-4" /> Đặt chỗ
        </button>
        <button onClick={() => setShowOrder(true)}
          className="flex-1 py-3 rounded-full border border-gold text-gold font-medium flex items-center justify-center gap-2 relative">
          <ShoppingBag className="h-4 w-4" /> Đặt món
          {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-gradient-gold text-primary-foreground text-[10px]">{cartCount}</span>}
        </button>
      </div>

      {showBook && <BookingModal r={r} onClose={() => setShowBook(false)} user={user} />}
      {showOrder && <OrderModal r={r} menu={menu} cart={cart} setCart={setCart} onClose={() => setShowOrder(false)} user={user} />}
    </div>
  );
}

function BookingModal({ r, onClose, user }: any) {
  const [form, setForm] = useState({
    guest_name: "", guest_phone: "", guest_email: user?.email ?? "",
    party_size: 2, booking_at: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      restaurant_id: r.id, user_id: user?.id ?? null,
      guest_name: form.guest_name, guest_phone: form.guest_phone, guest_email: form.guest_email,
      party_size: form.party_size, booking_at: form.booking_at, notes: form.notes,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Đã gửi yêu cầu đặt chỗ. Nhà hàng sẽ liên hệ xác nhận."); onClose(); }
  }
  return (
    <div className="fixed inset-0 z-[60] bg-background/85 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-elegant">
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
          <textarea placeholder="Yêu cầu đặc biệt (sinh nhật, kỷ niệm, dị ứng...)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none transition" />
        </div>
        <div className="flex gap-2 mt-6">
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

function OrderModal({ r, menu, cart, setCart, onClose, user }: any) {
  const [form, setForm] = useState({
    guest_name: "", guest_phone: "", guest_email: user?.email ?? "",
    pickup_at: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const items = menu.filter((m: any) => cart[m.id] > 0).map((m: any) => ({
    id: m.id, name: m.name, price: Number(m.price), qty: cart[m.id],
  }));
  const total = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);

  function inc(id: string) { setCart((c: any) => ({ ...c, [id]: (c[id] || 0) + 1 })); }
  function dec(id: string) {
    setCart((c: any) => {
      const next = { ...c };
      if (next[id] > 1) next[id]--; else delete next[id];
      return next;
    });
  }
  function removeItem(id: string) {
    setCart((c: any) => { const n = { ...c }; delete n[id]; return n; });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return toast.error("Vui lòng chọn ít nhất một món");
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      restaurant_id: r.id,
      user_id: user?.id ?? null,
      guest_name: form.guest_name,
      guest_phone: form.guest_phone,
      items: items as any,
      total_amount: total,
      notes: form.pickup_at ? `Thời gian: ${new Date(form.pickup_at).toLocaleString("vi-VN")}\n${form.notes}` : form.notes,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã gửi yêu cầu đặt món. Nhà hàng sẽ liên hệ xác nhận.");
      setCart({}); onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/85 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-elegant my-8">
        <span className="text-xs tracking-[0.3em] uppercase text-gold">Order</span>
        <h3 className="font-serif text-3xl mt-2 mb-1 flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-gold" /> Đặt món tại {r.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Chọn món, thời gian nhận và gửi yêu cầu. Nhà hàng sẽ xác nhận trong vòng 15 phút.</p>

        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-2">
          {items.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Utensils className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chưa có món trong giỏ. Cuộn lên menu để chọn món.</p>
            </div>
          ) : items.map((it: any) => (
            <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <div className="flex-1">
                <p className="font-serif">{it.name}</p>
                <p className="text-xs text-gold">{it.price.toLocaleString("vi-VN")}₫</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => dec(it.id)} className="h-7 w-7 grid place-items-center rounded-full border border-border hover:border-gold">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center font-serif">{it.qty}</span>
                <button type="button" onClick={() => inc(it.id)} className="h-7 w-7 grid place-items-center rounded-full border border-border hover:border-gold">
                  <Plus className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => removeItem(it.id)} className="ml-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="flex justify-between items-center py-4 border-t border-border mb-4">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Tổng tạm tính</span>
            <span className="font-serif text-2xl text-gold">{total.toLocaleString("vi-VN")}₫</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Họ tên" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
            <input required placeholder="Số điện thoại" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Thời gian nhận / phục vụ</label>
            <input required type="datetime-local" value={form.pickup_at} onChange={(e) => setForm({ ...form, pickup_at: e.target.value })}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
          </div>
          <textarea placeholder="Ghi chú (giao hàng, dị ứng, yêu cầu chế biến...)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
        </div>

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:border-gold">Đóng</button>
          <button type="submit" disabled={submitting || items.length === 0}
            className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition disabled:opacity-60">
            {submitting ? "Đang gửi..." : "Xác nhận đặt món"}
          </button>
        </div>
      </form>
    </div>
  );
}

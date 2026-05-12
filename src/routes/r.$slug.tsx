import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MapPin, Phone, Clock, Heart, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/r/$slug")({
  component: RestaurantPage,
});

function RestaurantPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [r, setR] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
      setR(data);
      if (data) {
        const [{ data: m }, { data: d }] = await Promise.all([
          supabase.from("menu_items").select("*").eq("restaurant_id", data.id).order("sort_order"),
          supabase.from("deals").select("*").eq("restaurant_id", data.id).eq("is_active", true),
        ]);
        setMenu(m ?? []); setDeals(d ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  async function addFavorite() {
    if (!user) return toast.error("Vui lòng đăng nhập");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: r.id });
    if (error) toast.error(error.message); else toast.success("Đã lưu vào yêu thích");
  }

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!r) return <div className="min-h-screen bg-background grid place-items-center text-muted-foreground">Không tìm thấy nhà hàng</div>;

  const lc = r.landing_content || {};
  const cover = r.cover_image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative min-h-[80vh] flex items-end pb-16 overflow-hidden">
          <img src={cover} alt={r.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="relative mx-auto max-w-7xl px-6 w-full">
            <span className="text-xs tracking-[0.3em] uppercase text-gold">{r.cuisine_type || "Fine dining"}</span>
            <h1 className="font-serif text-5xl md:text-7xl mt-3 max-w-3xl">{r.name}</h1>
            {lc.hero_tagline && <p className="text-xl text-muted-foreground mt-4 max-w-2xl italic">{lc.hero_tagline}</p>}
            <div className="flex flex-wrap items-center gap-6 mt-8 text-sm">
              {r.city && <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-gold" /> {r.address || r.city}</span>}
              {r.phone && <span className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-gold" /> {r.phone}</span>}
              {lc.hours && <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-gold" /> {lc.hours}</span>}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowBook(true)} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition">
                Đặt chỗ
              </button>
              <button onClick={addFavorite} className="px-6 py-3 rounded-full border border-border hover:border-gold flex items-center gap-2">
                <Heart className="h-4 w-4" /> Lưu
              </button>
            </div>
          </div>
        </section>

        {/* Story */}
        {lc.story && (
          <section className="py-24 border-t border-border">
            <div className="mx-auto max-w-3xl px-6 text-center">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Câu chuyện</span>
              <p className="font-serif text-2xl md:text-3xl leading-relaxed mt-6 italic">"{lc.story}"</p>
            </div>
          </section>
        )}

        {/* Deals */}
        {deals.length > 0 && (
          <section className="py-20 border-t border-border bg-secondary/30">
            <div className="mx-auto max-w-7xl px-6">
              <h2 className="font-serif text-3xl mb-8 flex items-center gap-3"><Sparkles className="h-6 w-6 text-gold" /> Ưu đãi đang diễn ra</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {deals.map((d) => (
                  <div key={d.id} className="p-6 rounded-2xl bg-card border border-border">
                    <span className="text-xs uppercase tracking-wider text-gold">{d.badge}</span>
                    <h3 className="font-serif text-xl mt-2">{d.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{d.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Menu */}
        <section className="py-24 border-t border-border">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-12">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Thực đơn</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">À la carte</h2>
            </div>
            {menu.length === 0 ? (
              <p className="text-center text-muted-foreground">Đang cập nhật thực đơn.</p>
            ) : (
              <div className="space-y-4">
                {menu.map((m) => (
                  <div key={m.id} className="flex justify-between gap-6 py-5 border-b border-border">
                    <div className="flex-1">
                      <h4 className="font-serif text-xl">{m.name} {m.is_signature && <span className="text-xs text-gold ml-2">Signature</span>}</h4>
                      {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                    </div>
                    <div className="text-gold font-serif text-xl">{Number(m.price).toLocaleString("vi-VN")}₫</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />

      {showBook && <BookingModal r={r} onClose={() => setShowBook(false)} user={user} />}
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
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
        <h3 className="font-serif text-2xl mb-1">Đặt chỗ tại {r.name}</h3>
        <p className="text-sm text-muted-foreground mb-6">Nhà hàng sẽ liên hệ để xác nhận.</p>
        <div className="space-y-3">
          <input required placeholder="Họ tên" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
          <input required placeholder="Số điện thoại" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="datetime-local" value={form.booking_at} onChange={(e) => setForm({ ...form, booking_at: e.target.value })}
              className="px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
            <input required type="number" min={1} placeholder="Số khách" value={form.party_size} onChange={(e) => setForm({ ...form, party_size: +e.target.value })}
              className="px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
          </div>
          <textarea placeholder="Ghi chú (tùy chọn)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
        </div>
        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-border">Hủy</button>
          <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">
            {submitting ? "Đang gửi..." : <span className="flex items-center justify-center gap-2"><Calendar className="h-4 w-4" /> Đặt chỗ</span>}
          </button>
        </div>
      </form>
    </div>
  );
}

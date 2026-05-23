import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Heart, Calendar, Tag, MapPin, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Tài khoản — Maison Dining" }] }),
  component: AccountPage,
});

type Tab = "favorites" | "bookings" | "deals" | "profile";

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("favorites");
  const [favs, setFavs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "" });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function loadAll() {
    if (!user) return;
    const [f, b, p] = await Promise.all([
      supabase.from("favorites").select("*, restaurants(*), deals(*, restaurants(name, slug))").eq("user_id", user.id),
      supabase.from("bookings").select("*, restaurants(name, slug)").eq("user_id", user.id).order("booking_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    setFavs((f.data ?? []).filter((x: any) => x.restaurant_id));
    setSavedDeals((f.data ?? []).filter((x: any) => x.deal_id));
    setBookings(b.data ?? []);
    
    if (p.data) setProfile(p.data);
  }

  useEffect(() => { loadAll(); }, [user]);

  // Realtime sync: refresh when favorites/bookings change
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`account-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone,
    }).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("Đã lưu hồ sơ");
  }

  async function removeFavorite(id: string) {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã gỡ khỏi yêu thích");
    loadAll();
  }

  async function cancelBooking(id: string) {
    if (!confirm("Huỷ đặt chỗ này?")) return;
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã huỷ đặt chỗ");
    loadAll();
  }

  if (loading || !user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Tài khoản</span>
          <h1 className="font-serif text-4xl md:text-5xl mt-3 mb-8">Xin chào, {profile.full_name || user.email}</h1>

          <div className="flex gap-2 border-b border-border mb-10 overflow-x-auto">
            {[
              { k: "favorites", l: `Yêu thích (${favs.length})` },
              { k: "deals", l: `Ưu đãi đã lưu (${savedDeals.length})` },
              { k: "bookings", l: `Đặt chỗ (${bookings.length})` },
              { k: "profile", l: "Hồ sơ" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as Tab)}
                className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${tab === t.k ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {tab === "favorites" && (
            <div className="grid md:grid-cols-3 gap-6">
              {favs.length === 0 && <EmptyState icon={Heart} text="Chưa lưu nhà hàng nào." />}
              {favs.map((f) => (
                <div key={f.id} className="group relative rounded-2xl bg-card border border-border overflow-hidden hover:border-gold transition">
                  <button onClick={() => removeFavorite(f.id)} title="Gỡ yêu thích"
                    className="absolute top-3 right-3 z-10 h-8 w-8 grid place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition">
                    <X className="h-4 w-4" />
                  </button>
                  <Link to="/r/$slug" params={{ slug: f.restaurants?.slug ?? "" }} className="block">
                    {f.restaurants?.cover_image_url && <img src={f.restaurants.cover_image_url} alt="" className="aspect-[4/3] object-cover w-full" />}
                    <div className="p-5">
                      <h3 className="font-serif text-xl">{f.restaurants?.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {f.restaurants?.city}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {tab === "deals" && (
            <div className="grid md:grid-cols-2 gap-4">
              {savedDeals.length === 0 && <EmptyState icon={Tag} text="Chưa lưu ưu đãi nào." />}
              {savedDeals.map((f) => (
                <div key={f.id} className="relative p-6 rounded-2xl bg-card border border-border">
                  <button onClick={() => removeFavorite(f.id)} title="Gỡ"
                    className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-background/60 hover:bg-destructive hover:text-destructive-foreground transition">
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-xs uppercase tracking-wider text-gold">{f.deals?.restaurants?.name}</span>
                  <h3 className="font-serif text-xl mt-2">{f.deals?.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.deals?.description}</p>
                  {f.deals?.restaurants?.slug && (
                    <Link to="/r/$slug" params={{ slug: f.deals.restaurants.slug }} className="text-xs text-gold hover:underline mt-3 inline-block">
                      Xem nhà hàng →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "bookings" && (
            <div className="space-y-3">
              {bookings.length === 0 && <EmptyState icon={Calendar} text="Chưa có đặt chỗ nào." />}
              {bookings.map((b) => (
                <div key={b.id} className="p-5 rounded-xl bg-card border border-border flex flex-wrap justify-between gap-3">
                  <div>
                    <Link to="/r/$slug" params={{ slug: b.restaurants?.slug ?? "" }} className="font-serif text-lg hover:text-gold">{b.restaurants?.name}</Link>
                    <p className="text-sm text-muted-foreground">{new Date(b.booking_at).toLocaleString("vi-VN")} · {b.party_size} khách</p>
                    {b.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{b.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <span className={`text-xs px-3 py-1 rounded-full ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span>
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <button onClick={() => cancelBooking(b.id)} className="text-xs px-3 py-1 rounded-full border border-border hover:border-destructive hover:text-destructive transition">
                        Huỷ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}


          {tab === "profile" && (
            <div className="max-w-md space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
                <input value={user.email ?? ""} disabled className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border opacity-60" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Họ tên</label>
                <input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Số điện thoại</label>
                <input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveProfile} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Lưu thay đổi</button>
                <Link to="/reset-password" className="px-6 py-3 rounded-full border border-border hover:border-gold inline-flex items-center">Đổi mật khẩu</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="col-span-full text-center py-20 text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 text-gold opacity-50" />
      <p>{text}</p>
    </div>
  );
}

function statusBadge(s: string) {
  return ({
    pending: "bg-gold/15 text-gold border border-gold/30",
    confirmed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    cancelled: "bg-destructive/15 text-destructive border border-destructive/30",
    rejected: "bg-destructive/15 text-destructive border border-destructive/30",
  } as any)[s] ?? "bg-card border border-border";
}
function statusLabel(s: string) {
  return ({ pending: "Chờ xác nhận", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Đã huỷ", rejected: "Từ chối" } as any)[s] ?? s;
}

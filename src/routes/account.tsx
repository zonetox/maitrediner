import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Heart, Calendar, Tag, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Tài khoản — Maître" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"favorites" | "bookings" | "deals" | "profile">("favorites");
  const [favs, setFavs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "" });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: f } = await supabase
        .from("favorites")
        .select("*, restaurants(*), deals(*, restaurants(name, slug))")
        .eq("user_id", user.id);
      setFavs((f ?? []).filter((x) => x.restaurant_id));
      setSavedDeals((f ?? []).filter((x) => x.deal_id));
      const { data: b } = await supabase
        .from("bookings").select("*, restaurants(name, slug)").eq("user_id", user.id)
        .order("booking_at", { ascending: false });
      setBookings(b ?? []);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) setProfile(p);
    })();
  }, [user]);

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone,
    }).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("Đã lưu hồ sơ");
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
              { k: "favorites", l: "Nhà hàng yêu thích" },
              { k: "deals", l: "Ưu đãi đã lưu" },
              { k: "bookings", l: "Đặt chỗ" },
              { k: "profile", l: "Hồ sơ" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${tab === t.k ? "border-gold text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {tab === "favorites" && (
            <div className="grid md:grid-cols-3 gap-6">
              {favs.length === 0 && <EmptyState icon={Heart} text="Chưa lưu nhà hàng nào." />}
              {favs.map((f) => (
                <Link key={f.id} to="/r/$slug" params={{ slug: f.restaurants?.slug ?? "" }} className="group block rounded-2xl bg-card border border-border overflow-hidden hover:border-gold transition">
                  {f.restaurants?.cover_image_url && <img src={f.restaurants.cover_image_url} alt="" className="aspect-[4/3] object-cover w-full" />}
                  <div className="p-5">
                    <h3 className="font-serif text-xl">{f.restaurants?.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {f.restaurants?.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {tab === "deals" && (
            <div className="grid md:grid-cols-2 gap-4">
              {savedDeals.length === 0 && <EmptyState icon={Tag} text="Chưa lưu ưu đãi nào." />}
              {savedDeals.map((f) => (
                <div key={f.id} className="p-6 rounded-2xl bg-card border border-border">
                  <span className="text-xs uppercase tracking-wider text-gold">{f.deals?.restaurants?.name}</span>
                  <h3 className="font-serif text-xl mt-2">{f.deals?.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.deals?.description}</p>
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
                    <h3 className="font-serif text-lg">{b.restaurants?.name}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(b.booking_at).toLocaleString("vi-VN")} · {b.party_size} khách</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border border-border self-start">{b.status}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "profile" && (
            <div className="max-w-md space-y-4">
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
              <button onClick={saveProfile} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Lưu thay đổi</button>
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

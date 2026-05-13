import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Plus, ExternalLink, Save, Trash2, Calendar, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Quản trị nhà hàng — Maître" }] }),
  component: PartnerPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function PartnerPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState<"info" | "menu" | "bookings" | "deals">("info");
  const [menu, setMenu] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login", as: "restaurant" } });
  }, [loading, user, navigate]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("restaurants").select("*").eq("owner_id", user.id);
    setRestaurants(data ?? []);
    if ((data?.length ?? 0) > 0 && !selected) setSelected(data![0]);
  }
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data: m } = await supabase.from("menu_items").select("*").eq("restaurant_id", selected.id).order("sort_order");
      setMenu(m ?? []);
      const { data: b } = await supabase.from("bookings").select("*").eq("restaurant_id", selected.id).order("booking_at", { ascending: false });
      setBookings(b ?? []);
      const { data: d } = await supabase.from("deals").select("*").eq("restaurant_id", selected.id);
      setDeals(d ?? []);
    })();
  }, [selected]);

  async function createRestaurant() {
    const name = prompt("Tên nhà hàng?");
    if (!name) return;
    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase.from("restaurants").insert({
      owner_id: user!.id, name, slug, is_published: false,
      landing_content: { hero_tagline: "Trải nghiệm ẩm thực đáng nhớ", story: "Câu chuyện của chúng tôi...", hours: "11:00 - 22:00 hằng ngày" },
    }).select().single();
    if (error) toast.error(error.message); else { toast.success("Đã tạo nhà hàng"); load(); setSelected(data); }
  }

  async function saveRestaurant() {
    if (!selected) return;
    const { id, created_at, updated_at, owner_id, ...payload } = selected;
    const { error } = await supabase.from("restaurants").update(payload).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Đã lưu");
  }

  if (loading || !user) return <div className="min-h-screen bg-background" />;

  const trialDaysLeft = selected ? Math.max(0, Math.ceil((new Date(selected.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;
  const isExpired = selected?.membership_status === "trial" && trialDaysLeft === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-gold">Nhà hàng của bạn</span>
              <button onClick={createRestaurant} className="text-gold hover:scale-110 transition" title="Tạo nhà hàng">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {restaurants.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full text-left p-3 rounded-lg border transition ${selected?.id === r.id ? "border-gold bg-card" : "border-border hover:bg-card"}`}>
                <div className="font-serif text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.is_published ? "Đang công khai" : "Bản nháp"}</div>
              </button>
            ))}
            {restaurants.length === 0 && (
              <button onClick={createRestaurant} className="w-full p-6 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-gold">
                + Tạo nhà hàng đầu tiên
              </button>
            )}
          </aside>

          {/* Main */}
          {selected ? (
            <section className={isExpired ? "opacity-50 pointer-events-none relative" : "relative"}>
              {isExpired && (
                <div className="absolute inset-0 z-10 grid place-items-center pointer-events-auto">
                  <div className="bg-card border border-gold rounded-2xl p-8 max-w-md text-center shadow-gold">
                    <AlertTriangle className="h-8 w-8 text-gold mx-auto mb-3" />
                    <h3 className="font-serif text-2xl">Bản dùng thử đã hết hạn</h3>
                    <p className="text-sm text-muted-foreground mt-2">Nâng cấp gói thành viên để tiếp tục quản lý nhà hàng.</p>
                    <Link to="/partner/membership" className="inline-block mt-5 px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Nâng cấp ngay</Link>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-serif text-3xl">{selected.name}</h1>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {selected.membership_status === "trial" && (
                      <span className="px-2 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Dùng thử · còn {trialDaysLeft} ngày
                      </span>
                    )}
                    {selected.membership_status === "active" && (
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">Gói thành viên đang hoạt động</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/r/$slug" params={{ slug: selected.slug }} target="_blank" className="px-4 py-2 rounded-full border border-border text-sm flex items-center gap-2 hover:border-gold">
                    <ExternalLink className="h-3 w-3" /> Xem trang
                  </Link>
                  <button onClick={saveRestaurant} className="px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium flex items-center gap-2">
                    <Save className="h-3 w-3" /> Lưu
                  </button>
                </div>
              </div>

              <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
                {[
                  { k: "info", l: "Thông tin & Landing page" },
                  { k: "menu", l: `Menu (${menu.length})` },
                  { k: "bookings", l: `Đặt chỗ (${bookings.length})` },
                  { k: "deals", l: `Ưu đãi (${deals.length})` },
                ].map((t) => (
                  <button key={t.k} onClick={() => setTab(t.k as any)}
                    className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 ${tab === t.k ? "border-gold" : "border-transparent text-muted-foreground"}`}>
                    {t.l}
                  </button>
                ))}
              </div>

              {tab === "info" && <InfoTab r={selected} setR={setSelected} />}
              {tab === "menu" && <MenuTab restaurantId={selected.id} menu={menu} reload={() => setSelected({ ...selected })} />}
              {tab === "bookings" && <BookingsTab bookings={bookings} reload={() => setSelected({ ...selected })} />}
              {tab === "deals" && <DealsTab restaurantId={selected.id} deals={deals} reload={() => setSelected({ ...selected })} />}
            </section>
          ) : (
            <section className="grid place-items-center min-h-[60vh] text-center">
              <div>
                <h2 className="font-serif text-3xl">Chào mừng đến với Maître Partner</h2>
                <p className="text-muted-foreground mt-3 mb-6">Tạo nhà hàng đầu tiên để bắt đầu 30 ngày dùng thử.</p>
                <button onClick={createRestaurant} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">+ Tạo nhà hàng</button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={4}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
      ) : (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
      )}
    </div>
  );
}

function InfoTab({ r, setR }: any) {
  const lc = r.landing_content || {};
  const setLC = (k: string, v: any) => setR({ ...r, landing_content: { ...lc, [k]: v } });
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Field label="Tên nhà hàng" value={r.name} onChange={(v: any) => setR({ ...r, name: v })} />
      <Field label="Slug (đường dẫn)" value={r.slug} onChange={(v: any) => setR({ ...r, slug: v })} />
      <Field label="Loại hình ẩm thực" value={r.cuisine_type} onChange={(v: any) => setR({ ...r, cuisine_type: v })} />
      <Field label="Thành phố" value={r.city} onChange={(v: any) => setR({ ...r, city: v })} />
      <Field label="Địa chỉ" value={r.address} onChange={(v: any) => setR({ ...r, address: v })} />
      <Field label="Điện thoại" value={r.phone} onChange={(v: any) => setR({ ...r, phone: v })} />
      <Field label="Mức giá" value={r.price_range} onChange={(v: any) => setR({ ...r, price_range: v })} />
      <Field label="Ảnh bìa (URL)" value={r.cover_image_url} onChange={(v: any) => setR({ ...r, cover_image_url: v })} />
      <div className="md:col-span-2">
        <Field label="Mô tả ngắn" textarea value={r.short_description} onChange={(v: any) => setR({ ...r, short_description: v })} />
      </div>
      <div className="md:col-span-2 pt-6 border-t border-border">
        <h3 className="font-serif text-xl mb-4 text-gold">Nội dung Landing page</h3>
      </div>
      <Field label="Tagline (Hero)" value={lc.hero_tagline} onChange={(v: any) => setLC("hero_tagline", v)} />
      <Field label="Giờ mở cửa" value={lc.hours} onChange={(v: any) => setLC("hours", v)} />
      <div className="md:col-span-2">
        <Field label="Câu chuyện nhà hàng" textarea value={lc.story} onChange={(v: any) => setLC("story", v)} />
      </div>
      <div className="md:col-span-2 flex items-center gap-3 mt-2">
        <input type="checkbox" id="pub" checked={r.is_published} onChange={(e) => setR({ ...r, is_published: e.target.checked })}
          className="h-4 w-4 accent-[var(--color-gold)]" />
        <label htmlFor="pub" className="text-sm">Công khai trên Maître</label>
      </div>
    </div>
  );
}

function MenuTab({ restaurantId, menu, reload }: any) {
  async function add() {
    const name = prompt("Tên món?"); if (!name) return;
    const price = Number(prompt("Giá (VNĐ)?") || 0);
    await supabase.from("menu_items").insert({ restaurant_id: restaurantId, name, price });
    reload();
  }
  async function remove(id: string) {
    await supabase.from("menu_items").delete().eq("id", id); reload();
  }
  return (
    <div>
      <button onClick={add} className="mb-4 px-4 py-2 rounded-full border border-gold text-gold text-sm flex items-center gap-2">
        <Plus className="h-3 w-3" /> Thêm món
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {menu.map((m: any) => (
          <div key={m.id} className="p-4 rounded-xl bg-card border border-border flex justify-between gap-3">
            <div>
              <h4 className="font-serif text-lg">{m.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
              <p className="text-gold text-sm mt-2">{Number(m.price).toLocaleString("vi-VN")}₫</p>
            </div>
            <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {menu.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Chưa có món nào.</p>}
      </div>
    </div>
  );
}

function BookingsTab({ bookings, reload }: any) {
  async function setStatus(id: string, status: "confirmed" | "cancelled" | "completed" | "pending") {
    await supabase.from("bookings").update({ status }).eq("id", id); reload();
  }
  return (
    <div className="space-y-3">
      {bookings.length === 0 && <p className="text-muted-foreground text-sm">Chưa có đặt chỗ.</p>}
      {bookings.map((b: any) => (
        <div key={b.id} className="p-5 rounded-xl bg-card border border-border flex flex-wrap justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /><span className="font-serif text-lg">{b.guest_name}</span></div>
            <p className="text-sm text-muted-foreground mt-1">{new Date(b.booking_at).toLocaleString("vi-VN")} · {b.party_size} khách · {b.guest_phone}</p>
            {b.notes && <p className="text-xs text-muted-foreground mt-2">"{b.notes}"</p>}
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className="text-xs px-2 py-1 rounded-full border border-border">{b.status}</span>
            {b.status === "pending" && (
              <>
                <button onClick={() => setStatus(b.id, "confirmed")} className="text-xs px-3 py-1 rounded-full bg-gold text-primary-foreground">Xác nhận</button>
                <button onClick={() => setStatus(b.id, "cancelled")} className="text-xs px-3 py-1 rounded-full border border-border">Từ chối</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DealsTab({ restaurantId, deals, reload }: any) {
  async function add() {
    const title = prompt("Tiêu đề ưu đãi?"); if (!title) return;
    const description = prompt("Mô tả?") || "";
    await supabase.from("deals").insert({ restaurant_id: restaurantId, title, description, badge: "Mới", tag: "Ưu đãi" });
    reload();
  }
  async function remove(id: string) {
    await supabase.from("deals").delete().eq("id", id); reload();
  }
  return (
    <div>
      <button onClick={add} className="mb-4 px-4 py-2 rounded-full border border-gold text-gold text-sm flex items-center gap-2">
        <Plus className="h-3 w-3" /> Thêm ưu đãi
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {deals.map((d: any) => (
          <div key={d.id} className="p-5 rounded-xl bg-card border border-border flex justify-between gap-3">
            <div>
              <span className="text-xs text-gold">{d.badge}</span>
              <h4 className="font-serif text-lg mt-1">{d.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
            </div>
            <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {deals.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Chưa có ưu đãi.</p>}
      </div>
    </div>
  );
}

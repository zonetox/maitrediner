import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Plus, ExternalLink, Save, Trash2, Calendar, AlertTriangle, Sparkles, Star, ShoppingBag, Phone, Radio, LayoutDashboard, UtensilsCrossed, Tag, Settings, TrendingUp, Clock, CheckCircle2, DollarSign, Users, ChevronRight, Eye, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader, MultiImageUploader } from "@/components/ImageUploader";
import { notify } from "@/lib/notify.functions";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Quản trị nhà hàng — Maison Dining" }] }),
  component: PartnerPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type Tab = "dashboard" | "info" | "menu" | "bookings" | "orders" | "deals";

function PartnerPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [menu, setMenu] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const dirty = selected ? JSON.stringify(selected) !== savedSnapshot : false;

  function selectRestaurant(r: any) {
    if (dirty && selected && r?.id !== selected.id) {
      if (!confirm("Bạn có thay đổi chưa lưu. Chuyển nhà hàng khác sẽ mất các thay đổi này. Tiếp tục?")) return;
    }
    setSelected(r);
    setSavedSnapshot(r ? JSON.stringify(r) : "");
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login", as: "restaurant" } });
  }, [loading, user, navigate]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).order("created_at");
    setRestaurants(data ?? []);
    if (!selected && (data?.length ?? 0) > 0) {
      setSelected(data![0]);
      setSavedSnapshot(JSON.stringify(data![0]));
    }
    if (selected) {
      const fresh = data?.find((r) => r.id === selected.id);
      if (fresh && !dirty) {
        setSelected(fresh);
        setSavedSnapshot(JSON.stringify(fresh));
      }
    }
  }
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const [m, b, o, d] = await Promise.all([
        supabase.from("menu_items").select("*").eq("restaurant_id", selected.id).order("sort_order"),
        supabase.from("bookings").select("*").eq("restaurant_id", selected.id).order("booking_at", { ascending: false }),
        supabase.from("orders").select("*").eq("restaurant_id", selected.id).order("created_at", { ascending: false }),
        supabase.from("deals").select("*").eq("restaurant_id", selected.id).order("created_at", { ascending: false }),
      ]);
      setMenu(m.data ?? []);
      setBookings(b.data ?? []);
      setOrders(o.data ?? []);
      setDeals(d.data ?? []);
    })();
  }, [selected?.id, refreshTick]);

  // Realtime: live-update bookings & orders for the selected restaurant
  useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel(`partner-${selected.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `restaurant_id=eq.${selected.id}` }, (payload) => {
        setBookings((cur) => mergeRow(cur, payload, "booking_at"));
        if (payload.eventType === "INSERT") toast.success("🔔 Đặt chỗ mới vừa đến!");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${selected.id}` }, (payload) => {
        setOrders((cur) => mergeRow(cur, payload, "created_at"));
        if (payload.eventType === "INSERT") toast.success("🔔 Đơn món mới vừa đến!");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id]);

  const reload = () => setRefreshTick((t) => t + 1);

  async function createRestaurant(name: string) {
    // Check quota: sum of max_restaurants across owner's active/trial restaurants. Default trial = 1.
    const { data: owned } = await supabase.from("restaurants").select("plan_slug, membership_status, trial_ends_at, membership_ends_at").eq("owner_id", user!.id);
    const now = Date.now();
    const activeSlugs = (owned ?? []).filter((r: any) => {
      if (r.membership_status === "active" && (!r.membership_ends_at || new Date(r.membership_ends_at).getTime() > now)) return true;
      if (r.membership_status === "trial" && r.trial_ends_at && new Date(r.trial_ends_at).getTime() > now) return true;
      return false;
    }).map((r: any) => r.plan_slug).filter(Boolean);
    let quota = 1; // trial baseline
    if (activeSlugs.length) {
      const { data: planRows } = await supabase.from("membership_plans").select("slug,max_restaurants").in("slug", activeSlugs);
      quota = Math.max(quota, ...(planRows ?? []).map((p: any) => p.max_restaurants ?? 1));
    }
    if ((owned?.length ?? 0) >= quota) {
      return toast.error(`Gói hiện tại chỉ cho phép tối đa ${quota} nhà hàng. Vui lòng nâng cấp gói để tạo thêm.`);
    }
    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase.from("restaurants").insert({
      owner_id: user!.id, name, slug, is_published: false,
      landing_content: { hero_tagline: "Trải nghiệm ẩm thực đáng nhớ", story: "Câu chuyện của chúng tôi...", hours: "11:00 - 22:00 hằng ngày" },
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Đã tạo nhà hàng — bắt đầu 30 ngày dùng thử miễn phí");
    setCreateOpen(false);
    const { data: all } = await supabase.from("restaurants").select("*").eq("owner_id", user!.id);
    setRestaurants(all ?? []);
    setSelected(data);
    setSavedSnapshot(JSON.stringify(data));
  }

  async function saveRestaurant() {
    if (!selected) return;
    const { id, created_at, updated_at, owner_id, ...payload } = selected;
    const { error } = await supabase.from("restaurants").update(payload).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã lưu thay đổi");
      setSavedSnapshot(JSON.stringify(selected));
      load();
    }
  }

  async function deleteRestaurant() {
    if (!selected || !confirm(`Xoá nhà hàng "${selected.name}"? Toàn bộ dữ liệu liên quan sẽ mất.`)) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá nhà hàng");
    setSelected(null); load();
  }

  if (loading || !user) return <div className="min-h-screen bg-background" />;

  const trialDaysLeft = selected ? Math.max(0, Math.ceil((new Date(selected.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;
  const isExpired = selected?.membership_status === "trial" && trialDaysLeft === 0;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const navItems: { k: Tab; l: string; icon: any; badge?: number }[] = [
    { k: "dashboard", l: "Tổng quan", icon: LayoutDashboard },
    { k: "bookings", l: "Đặt chỗ", icon: Calendar, badge: pendingBookings },
    { k: "orders", l: "Đơn món", icon: ShoppingBag, badge: pendingOrders },
    { k: "menu", l: "Thực đơn", icon: UtensilsCrossed, badge: menu.length },
    { k: "deals", l: "Ưu đãi", icon: Tag, badge: deals.length },
    { k: "info", l: "Thông tin & Landing", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 grid lg:grid-cols-[280px_1fr] gap-6">
          {/* ───────── Sidebar ───────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Restaurant switcher */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-medium">Nhà hàng</span>
                <button onClick={() => setCreateOpen(true)} className="h-7 w-7 grid place-items-center rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition" title="Tạo nhà hàng">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {restaurants.map((r) => (
                  <button key={r.id} onClick={() => selectRestaurant(r)}
                    className={`w-full text-left p-3 rounded-xl border transition group ${selected?.id === r.id ? "border-gold bg-gradient-to-br from-gold/10 to-transparent shadow-sm" : "border-border hover:border-gold/50 hover:bg-card"}`}>
                    <div className="flex items-center gap-2.5">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover border border-border shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gradient-gold grid place-items-center text-primary-foreground font-serif text-sm shrink-0">
                          {r.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-sm truncate flex items-center gap-1.5">
                          {r.name}
                          {selected?.id === r.id && dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" title="Chưa lưu" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${r.is_published ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
                          {r.is_published ? "Công khai" : "Bản nháp"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {restaurants.length === 0 && (
                  <button onClick={() => setCreateOpen(true)} className="w-full p-5 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-gold hover:text-gold transition">
                    + Tạo nhà hàng đầu tiên
                  </button>
                )}
              </div>
            </div>

            {/* Section nav */}
            {selected && (
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium px-1">Quản lý</span>
                <nav className="mt-3 space-y-0.5">
                  {navItems.map((n) => {
                    const Icon = n.icon;
                    const active = tab === n.k;
                    return (
                      <button key={n.k} onClick={() => setTab(n.k)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-gold/15 text-gold font-medium" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{n.l}</span>
                        {n.badge !== undefined && n.badge > 0 && (
                          <span className={`px-1.5 min-w-[20px] h-5 grid place-items-center rounded-full text-[10px] font-semibold ${active ? "bg-gold text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {n.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
                <div className="mt-4 pt-4 border-t border-border space-y-0.5">
                  <Link to="/partner/membership" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-gold transition">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">Gói thành viên</span>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </Link>
                  <Link to="/r/$slug" params={{ slug: selected.slug }} target="_blank" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground transition">
                    <Eye className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">Xem trang công khai</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </Link>
                </div>
              </div>
            )}
          </aside>

          {/* ───────── Main ───────── */}
          {selected ? (
            <section className={isExpired ? "opacity-60 pointer-events-none relative" : "relative"}>
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

              {/* Header card */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-5 md:p-6 mb-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                      <span>Quản lý nhà hàng</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-foreground">{navItems.find((n) => n.k === tab)?.l}</span>
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl truncate">{selected.name}</h1>
                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      {selected.membership_status === "trial" && (
                        <span className="px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" /> Dùng thử · còn {trialDaysLeft} ngày
                        </span>
                      )}
                      {selected.membership_status === "active" && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" /> Gói thành viên đang hoạt động
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${selected.is_published ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-muted/40 text-muted-foreground border-border"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selected.is_published ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                        {selected.is_published ? "Đang công khai" : "Bản nháp"}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <Radio className="h-3 w-3 animate-pulse" /> Đồng bộ trực tiếp
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={deleteRestaurant} className="h-9 px-3 rounded-lg border border-border text-sm flex items-center gap-1.5 hover:border-destructive hover:text-destructive transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={saveRestaurant} disabled={!dirty}
                      className={`h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${dirty ? "bg-gradient-gold text-primary-foreground shadow-gold ring-2 ring-gold/40 animate-pulse" : "bg-card border border-border text-muted-foreground"}`}>
                      <Save className="h-3.5 w-3.5" /> {dirty ? "Lưu thay đổi" : "Đã lưu"}
                    </button>
                  </div>
                </div>
              </div>

              {dirty && (
                <div className="sticky top-16 z-20 mb-4 px-4 py-3 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 text-sm flex items-center justify-between gap-3 backdrop-blur">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Bạn có thay đổi chưa lưu.
                  </span>
                  <button onClick={saveRestaurant} className="shrink-0 px-3 py-1.5 rounded-full bg-gradient-gold text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                    <Save className="h-3 w-3" /> Lưu ngay
                  </button>
                </div>
              )}

              {tab === "dashboard" && (
                <DashboardTab
                  restaurant={selected}
                  bookings={bookings}
                  orders={orders}
                  menu={menu}
                  deals={deals}
                  pendingBookings={pendingBookings}
                  pendingOrders={pendingOrders}
                  goTo={setTab}
                />
              )}
              {tab === "info" && <InfoTab r={selected} setR={setSelected} />}
              {tab === "menu" && <MenuTab restaurantId={selected.id} menu={menu} reload={reload} />}
              {tab === "bookings" && <BookingsTab bookings={bookings} restaurantId={selected.id} reload={reload} />}
              {tab === "orders" && <OrdersTab orders={orders} restaurantId={selected.id} reload={reload} />}
              {tab === "deals" && <DealsTab restaurantId={selected.id} deals={deals} reload={reload} />}
            </section>
          ) : (
            <section className="grid place-items-center min-h-[60vh] text-center">
              <div>
                <h2 className="font-serif text-3xl">Chào mừng đến với Maison Dining Partner</h2>
                <p className="text-muted-foreground mt-3 mb-6">Tạo nhà hàng đầu tiên để bắt đầu 30 ngày dùng thử.</p>
                <button onClick={() => setCreateOpen(true)} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">+ Tạo nhà hàng</button>
              </div>
            </section>
          )}
        </div>
      </main>

      {createOpen && <CreateRestaurantModal onClose={() => setCreateOpen(false)} onCreate={createRestaurant} />}
    </div>
  );
}

function DashboardTab({ restaurant, bookings, orders, menu, deals, pendingBookings, pendingOrders, goTo }: any) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const bookingsToday = bookings.filter((b: any) => new Date(b.booking_at).getTime() >= todayMs).length;
  const ordersToday = orders.filter((o: any) => new Date(o.created_at).getTime() >= todayMs);
  const revenueToday = ordersToday.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
  const revenueTotal = orders.filter((o: any) => o.status === "completed").reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
  const upcomingBookings = bookings
    .filter((b: any) => new Date(b.booking_at).getTime() >= Date.now() && b.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.booking_at).getTime() - new Date(b.booking_at).getTime())
    .slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const activeDeals = deals.filter((d: any) => d.is_active).length;
  const signatureCount = menu.filter((m: any) => m.is_signature).length;

  const stats = [
    { l: "Đặt chỗ hôm nay", v: bookingsToday, sub: `${pendingBookings} chờ xác nhận`, icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" },
    { l: "Đơn món hôm nay", v: ordersToday.length, sub: `${pendingOrders} chờ xử lý`, icon: ShoppingBag, color: "text-purple-400", bg: "bg-purple-500/10" },
    { l: "Doanh thu hôm nay", v: revenueToday.toLocaleString("vi-VN") + "₫", sub: `Tổng: ${revenueTotal.toLocaleString("vi-VN")}₫`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { l: "Món trong thực đơn", v: menu.length, sub: `${signatureCount} món signature`, icon: UtensilsCrossed, color: "text-gold", bg: "bg-gold/10" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.l} className="p-4 rounded-xl border border-border bg-card hover:border-gold/40 transition">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg grid place-items-center ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="font-serif text-xl md:text-2xl mt-1 truncate">{s.v}</div>
              <div className="text-[11px] text-muted-foreground mt-1 truncate">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Thêm món mới", icon: Plus, tab: "menu" as Tab },
          { l: "Tạo ưu đãi", icon: Tag, tab: "deals" as Tab },
          { l: "Sửa thông tin", icon: Settings, tab: "info" as Tab },
          { l: "Xem đặt chỗ", icon: Calendar, tab: "bookings" as Tab },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.l} onClick={() => goTo(a.tab)} className="p-4 rounded-xl border border-dashed border-border hover:border-gold hover:bg-gold/5 transition flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-lg bg-gold/10 grid place-items-center text-gold group-hover:scale-110 transition">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{a.l}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming bookings */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> Đặt chỗ sắp tới</h3>
            <button onClick={() => goTo("bookings")} className="text-xs text-gold hover:underline flex items-center gap-1">Xem tất cả <ChevronRight className="h-3 w-3" /></button>
          </div>
          <div className="space-y-2">
            {upcomingBookings.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có đặt chỗ sắp tới.</p>}
            {upcomingBookings.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold grid place-items-center font-serif text-sm shrink-0">
                  {new Date(b.booking_at).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{b.guest_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {new Date(b.booking_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    <Users className="h-3 w-3 ml-1" /> {b.party_size}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full ${b.status === "confirmed" ? "bg-emerald-500/15 text-emerald-400" : "bg-gold/15 text-gold"}`}>
                  {b.status === "confirmed" ? "Đã xác nhận" : "Chờ"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-gold" /> Đơn món gần đây</h3>
            <button onClick={() => goTo("orders")} className="text-xs text-gold hover:underline flex items-center gap-1">Xem tất cả <ChevronRight className="h-3 w-3" /></button>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn món nào.</p>}
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{o.guest_name || "Khách"}</div>
                  <div className="text-xs text-muted-foreground">
                    {Array.isArray(o.items) ? o.items.length : 0} món · {new Date(o.created_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-gold font-medium">{Number(o.total_amount).toLocaleString("vi-VN")}₫</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${o.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : o.status === "pending" ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health/insights row */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-400" /> Ưu đãi đang hiển thị</div>
          <div className="font-serif text-2xl mt-1">{activeDeals}<span className="text-sm text-muted-foreground"> / {deals.length}</span></div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><BarChart3 className="h-3 w-3 text-blue-400" /> Tổng đặt chỗ</div>
          <div className="font-serif text-2xl mt-1">{bookings.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Star className="h-3 w-3 text-gold fill-gold" /> Đánh giá trung bình</div>
          <div className="font-serif text-2xl mt-1">{Number(restaurant.rating || 0).toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}

function CreateRestaurantModal({ onClose, onCreate }: any) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[60] bg-background/85 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) onCreate(name.trim()); }}
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-elegant">
        <h3 className="font-serif text-2xl mb-4">Tạo nhà hàng mới</h3>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Tên nhà hàng</label>
        <input autoFocus required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none"
          placeholder="Ví dụ: Nhà hàng Hoàng Yến" />
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:border-gold">Hủy</button>
          <button type="submit" className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Tạo</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, textarea, type }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={4}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
      ) : (
        <input type={type ?? "text"} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
      )}
    </div>
  );
}

function InfoTab({ r, setR }: any) {
  const lc = r.landing_content || {};
  const setLC = (k: string, v: any) => setR({ ...r, landing_content: { ...lc, [k]: v } });
  const gallery: string[] = lc.gallery || [];
  const amenities: string[] = Array.isArray(r.amenities) ? r.amenities : [];

  const [cuisines, setCuisines] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [amenitySuggestions, setAmenitySuggestions] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: cu }, { data: lo }, { data: rs }] = await Promise.all([
        supabase.from("cuisine_categories").select("name").eq("is_active", true).order("sort_order"),
        supabase.from("locations").select("name").eq("is_active", true).order("sort_order"),
        supabase.from("restaurants").select("amenities"),
      ]);
      setCuisines(cu?.map((c: any) => c.name) ?? []);
      setCities(lo?.map((c: any) => c.name) ?? []);
      const set = new Set<string>();
      (rs ?? []).forEach((row: any) => (row.amenities || []).forEach((a: string) => a && set.add(a)));
      ["Bãi đỗ xe", "Phòng VIP", "Sommelier", "Menu chay", "Phù hợp trẻ em", "Sân vườn", "Wifi", "View đẹp", "Nhạc sống", "Phù hợp họp mặt"]
        .forEach((a) => set.add(a));
      setAmenitySuggestions(Array.from(set).sort());
    })();
  }, []);

  function addAmenity(a: string) {
    const v = a.trim();
    if (!v || amenities.includes(v)) return;
    setR({ ...r, amenities: [...amenities, v] });
    setNewAmenity("");
  }
  function removeAmenity(a: string) {
    setR({ ...r, amenities: amenities.filter((x) => x !== a) });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Field label="Tên nhà hàng" value={r.name} onChange={(v: any) => setR({ ...r, name: v })} />
      <Field label="Slug (đường dẫn)" value={r.slug} onChange={(v: any) => setR({ ...r, slug: v })} />
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Loại hình ẩm thực</label>
        <input list="cuisine-list" value={r.cuisine_type ?? ""} onChange={(e) => setR({ ...r, cuisine_type: e.target.value })}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
        <datalist id="cuisine-list">
          {cuisines.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Thành phố / Địa điểm</label>
        <input list="city-list" value={r.city ?? ""} onChange={(e) => setR({ ...r, city: e.target.value })}
          className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
        <datalist id="city-list">
          {cities.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <Field label="Địa chỉ" value={r.address} onChange={(v: any) => setR({ ...r, address: v })} />
      <Field label="Điện thoại" value={r.phone} onChange={(v: any) => setR({ ...r, phone: v })} />
      <Field label="Mức giá ký hiệu (₫₫₫₫)" value={r.price_range} onChange={(v: any) => setR({ ...r, price_range: v })} />
      <Field label="Email" value={r.email} onChange={(v: any) => setR({ ...r, email: v })} />
      <Field label="Giá ước tính / khách – từ (VNĐ)" type="number" value={r.price_per_guest_min ?? ""} onChange={(v: any) => setR({ ...r, price_per_guest_min: v === "" ? null : Number(v) })} />
      <Field label="Giá ước tính / khách – đến (VNĐ)" type="number" value={r.price_per_guest_max ?? ""} onChange={(v: any) => setR({ ...r, price_per_guest_max: v === "" ? null : Number(v) })} />
      <div className="md:col-span-2">
        <Field label="Mô tả ngắn" textarea value={r.short_description} onChange={(v: any) => setR({ ...r, short_description: v })} />
      </div>

      {/* Fine-dining policies */}
      <div className="md:col-span-2 p-5 rounded-xl border border-gold/30 bg-card/40 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-3 -mb-1">
          <label className="text-xs uppercase tracking-wider text-gold flex items-center gap-2">
            <Sparkles className="h-3 w-3" /> Thông tin "vô hình nhưng quan trọng"
          </label>
          <p className="text-[11px] text-muted-foreground mt-1">Hiển thị ở trang nhà hàng để thực khách cao cấp chuẩn bị trước.</p>
        </div>
        <Field label="Quy định trang phục (Dress code)" textarea value={r.dress_code ?? ""} onChange={(v: any) => setR({ ...r, dress_code: v })} />
        <Field label="Chính sách hủy bàn" textarea value={r.cancellation_policy ?? ""} onChange={(v: any) => setR({ ...r, cancellation_policy: v })} />
        
      </div>

      {/* Amenities */}
      <div className="md:col-span-2 p-5 rounded-xl border border-border bg-card/40">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs uppercase tracking-wider text-gold flex items-center gap-2">
            <Sparkles className="h-3 w-3" /> Tiện ích & đặc trưng
          </label>
          <span className="text-[10px] text-muted-foreground">Hiển thị trong tìm kiếm</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
          {amenities.length === 0 && <span className="text-xs text-muted-foreground italic">Chưa có tiện ích nào.</span>}
          {amenities.map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-gold text-primary-foreground text-xs font-serif">
              {a}
              <button type="button" onClick={() => removeAmenity(a)} className="hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(newAmenity); } }}
            placeholder="Thêm tiện ích mới (Enter để thêm)..."
            className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-gold outline-none text-sm" />
          <button type="button" onClick={() => addAmenity(newAmenity)}
            className="px-4 py-2 rounded-lg border border-gold text-gold text-sm hover:bg-gold/10 inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        {amenitySuggestions.filter((s) => !amenities.includes(s)).length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Gợi ý nhanh</p>
            <div className="flex flex-wrap gap-1.5">
              {amenitySuggestions.filter((s) => !amenities.includes(s)).slice(0, 16).map((s) => (
                <button key={s} type="button" onClick={() => addAmenity(s)}
                  className="px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:border-gold hover:text-gold transition">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageUploader bucket="restaurant-images" folder={r.id} label="Ảnh bìa nhà hàng"
        value={r.cover_image_url} onChange={(url) => setR({ ...r, cover_image_url: url })} aspect="aspect-video" />
      <ImageUploader bucket="restaurant-images" folder={`${r.id}/logo`} label="Logo nhà hàng"
        value={r.logo_url} onChange={(url) => setR({ ...r, logo_url: url })} aspect="aspect-square" />
      <div className="md:col-span-2 pt-6 border-t border-border">
        <h3 className="font-serif text-xl mb-4 text-gold">Nội dung Landing page</h3>
      </div>
      <Field label="Tagline (Hero)" value={lc.hero_tagline} onChange={(v: any) => setLC("hero_tagline", v)} />

      {/* Hero media: 3 slides + optional YouTube */}
      <div className="md:col-span-2 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Hero · Slide hình ảnh (tối đa 3)</label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={!!lc.use_youtube}
              onChange={(e) => setLC("use_youtube", e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-gold)]" />
            Dùng video YouTube thay cho slide
          </label>
        </div>

        {lc.use_youtube ? (
          <div className="space-y-2">
            <input value={lc.hero_youtube_url ?? ""}
              onChange={(e) => setLC("hero_youtube_url", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <p className="text-[11px] text-muted-foreground">Video sẽ phát tự động (đã tắt tiếng) làm nền hero trên trang nhà hàng.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => {
              const slides = (lc.hero_slides ?? []) as { image: string; title: string }[];
              const slide = slides[i] ?? { image: "", title: "" };
              const updateSlide = (patch: Partial<{ image: string; title: string }>) => {
                const next = [...slides];
                next[i] = { ...slide, ...patch };
                setLC("hero_slides", next);
              };
              return (
                <div key={i} className="space-y-2">
                  <ImageUploader bucket="restaurant-images" folder={`${r.id}/hero`}
                    value={slide.image || null} aspect="aspect-video"
                    onChange={(url) => updateSlide({ image: url ?? "" })} />
                  <input value={slide.title}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                    placeholder={`Tiêu đề slide ${i + 1}`}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Giờ mở cửa</label>
        <div className="space-y-2 mt-2">
          {((lc.hours_list as { day: string; time: string }[]) ?? []).map((row, i) => (
            <div key={i} className="flex gap-2">
              <input value={row.day}
                onChange={(e) => {
                  const next = [...(lc.hours_list ?? [])];
                  next[i] = { ...next[i], day: e.target.value };
                  setLC("hours_list", next);
                }}
                placeholder="Vd: Thứ 2 – Thứ 5"
                className="w-1/3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <input value={row.time}
                onChange={(e) => {
                  const next = [...(lc.hours_list ?? [])];
                  next[i] = { ...next[i], time: e.target.value };
                  setLC("hours_list", next);
                }}
                placeholder="Vd: 11:30 – 14:30 · 18:00 – 22:30"
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <button type="button"
                onClick={() => {
                  const next = [...(lc.hours_list ?? [])];
                  next.splice(i, 1);
                  setLC("hours_list", next);
                }}
                className="px-3 rounded-md border border-border text-muted-foreground hover:text-destructive">×</button>
            </div>
          ))}
          <button type="button"
            onClick={() => setLC("hours_list", [...((lc.hours_list as any[]) ?? []), { day: "", time: "" }])}
            className="text-sm text-gold hover:underline">+ Thêm khung giờ</button>
        </div>
      </div>
      <Field label="Tên bếp trưởng" value={lc.chef_name} onChange={(v: any) => setLC("chef_name", v)} />
      <Field label="Chức danh bếp trưởng" value={lc.chef_title} onChange={(v: any) => setLC("chef_title", v)} />
      <div className="md:col-span-2">
        <Field label="Câu chuyện nhà hàng" textarea value={lc.story} onChange={(v: any) => setLC("story", v)} />
      </div>
      <div className="md:col-span-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Thư viện ảnh không gian (tối đa 6)</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <ImageUploader key={i} bucket="restaurant-images" folder={`${r.id}/gallery`}
              value={gallery[i] ?? null} aspect="aspect-square"
              onChange={(url) => {
                const next = [...gallery];
                if (url) next[i] = url; else next.splice(i, 1);
                setLC("gallery", next.filter(Boolean));
              }} />
          ))}
        </div>
      </div>
      <div className="md:col-span-2 flex items-center gap-3 mt-2">
        <input type="checkbox" id="pub" checked={r.is_published} onChange={(e) => setR({ ...r, is_published: e.target.checked })}
          className="h-4 w-4 accent-[var(--color-gold)]" />
        <label htmlFor="pub" className="text-sm">Công khai trên Maison Dining (nhớ bấm "Lưu" sau khi đổi)</label>
      </div>
    </div>
  );
}

function MenuTab({ restaurantId, menu, reload }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  function newItem() {
    setEditing({ restaurant_id: restaurantId, name: "", description: "", price: 0, is_signature: false, is_available: true, image_url: "", image_urls: [] });
  }
  async function save(item: any) {
    const { id, ...payload } = item;
    payload.price = Number(payload.price) || 0;
    if (id) {
      const { error } = await supabase.from("menu_items").update(payload as any).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("menu_items").insert(payload as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Đã lưu món"); setEditing(null); reload();
  }
  async function remove(id: string) {
    if (!confirm("Xoá món này?")) return;
    await supabase.from("menu_items").delete().eq("id", id); reload();
  }
  return (
    <div>
      <button onClick={newItem} className="mb-4 px-4 py-2 rounded-full border border-gold text-gold text-sm flex items-center gap-2">
        <Plus className="h-3 w-3" /> Thêm món
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {menu.map((m: any) => {
          const imgs: string[] = (m.image_urls?.length ? m.image_urls : (m.image_url ? [m.image_url] : []));
          return (
            <div key={m.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex gap-3">
                {imgs[0] && <img src={imgs[0]} alt={m.name} className="h-20 w-20 rounded-lg object-cover" />}
                <div className="flex-1">
                  <h4 className="font-serif text-lg flex items-center gap-2">
                    {m.name}
                    {m.is_signature && <Star className="h-3 w-3 text-gold fill-gold" />}
                    {!m.is_available && <span className="text-[10px] uppercase text-muted-foreground border border-border px-1.5 rounded">Tạm hết</span>}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                  <p className="text-gold text-sm mt-2">{Number(m.price).toLocaleString("vi-VN")}₫</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setEditing(m)} className="text-xs text-muted-foreground hover:text-gold">Sửa</button>
                  <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-1 mt-2">
                  {imgs.slice(1, 3).map((u, i) => <img key={i} src={u} alt="" className="h-10 w-10 rounded object-cover" />)}
                </div>
              )}
            </div>
          );
        })}
        {menu.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Chưa có món nào.</p>}
      </div>

      {editing && <MenuItemModal item={editing} restaurantId={restaurantId} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function MenuItemModal({ item, restaurantId, onClose, onSave }: any) {
  const [form, setForm] = useState<any>(item);
  return (
    <div className="fixed inset-0 z-[60] bg-background/85 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-elegant my-8">
        <h3 className="font-serif text-2xl mb-4">{form.id ? "Sửa món" : "Thêm món mới"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tên món" value={form.name} onChange={(v: any) => setForm({ ...form, name: v })} />
          <Field label="Giá (VNĐ)" value={form.price} onChange={(v: any) => setForm({ ...form, price: v })} />
          <div className="md:col-span-2">
            <Field label="Mô tả" textarea value={form.description} onChange={(v: any) => setForm({ ...form, description: v })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Ảnh món ăn (tối đa 3)</label>
            <div className="mt-2">
              <MultiImageUploader bucket="menu-images" folder={`${restaurantId}`}
                value={form.image_urls || []} onChange={(urls) => setForm({ ...form, image_urls: urls, image_url: urls[0] || "" })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_signature} onChange={(e) => setForm({ ...form, is_signature: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-gold)]" />
            Món signature
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-gold)]" />
            Đang bán
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:border-gold">Hủy</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Lưu</button>
        </div>
      </div>
    </div>
  );
}

function BookingsTab({ bookings, restaurantId, reload }: any) {
  const notifyFn = useServerFn(notify);
  async function setStatus(id: string, status: "confirmed" | "cancelled" | "completed" | "pending") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã cập nhật"); reload();
    notifyFn({ data: { type: "booking_status", restaurantId, recordId: id, newStatus: status } }).catch(() => {});
  }
  return (
    <div className="space-y-3">
      {bookings.length === 0 && <p className="text-muted-foreground text-sm">Chưa có đặt chỗ.</p>}
      {bookings.map((b: any) => (
        <div key={b.id} className="p-5 rounded-xl bg-card border border-border flex flex-wrap justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /><span className="font-serif text-lg">{b.guest_name}</span></div>
            <p className="text-sm text-muted-foreground mt-1">{new Date(b.booking_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })} · {b.party_size} khách</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="h-3 w-3" /> <a href={`tel:${b.guest_phone}`} className="hover:text-gold">{b.guest_phone}</a>{b.guest_email && <span className="ml-2">· {b.guest_email}</span>}</p>
            {b.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{b.notes}"</p>}
          </div>
          <div className="flex items-center gap-2 self-start flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full border border-border">{b.status}</span>
            {b.status === "pending" && (
              <>
                <button onClick={() => setStatus(b.id, "confirmed")} className="text-xs px-3 py-1 rounded-full bg-gold text-primary-foreground">Xác nhận</button>
                <button onClick={() => setStatus(b.id, "cancelled")} className="text-xs px-3 py-1 rounded-full border border-border">Từ chối</button>
              </>
            )}
            {b.status === "confirmed" && (
              <button onClick={() => setStatus(b.id, "completed")} className="text-xs px-3 py-1 rounded-full border border-gold text-gold">Hoàn tất</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersTab({ orders, restaurantId, reload }: any) {
  const notifyFn = useServerFn(notify);
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã cập nhật"); reload();
    notifyFn({ data: { type: "order_status", restaurantId, recordId: id, newStatus: status } }).catch(() => {});
  }
  return (
    <div className="space-y-3">
      {orders.length === 0 && <p className="text-muted-foreground text-sm">Chưa có đơn món.</p>}
      {orders.map((o: any) => (
        <div key={o.id} className="p-5 rounded-xl bg-card border border-border">
          <div className="flex flex-wrap justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-gold" /><span className="font-serif text-lg">{o.guest_name || "Khách"}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("vi-VN")}</p>
              {o.guest_phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> <a href={`tel:${o.guest_phone}`} className="hover:text-gold">{o.guest_phone}</a></p>}
            </div>
            <div className="text-right">
              <span className="text-xs px-2 py-1 rounded-full border border-border">{o.status}</span>
              <div className="text-gold font-serif text-xl mt-1">{Number(o.total_amount).toLocaleString("vi-VN")}₫</div>
            </div>
          </div>
          <div className="border-t border-border pt-3 space-y-1">
            {Array.isArray(o.items) && o.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{it.qty}× {it.name}</span>
                <span>{(it.price * it.qty).toLocaleString("vi-VN")}₫</span>
              </div>
            ))}
          </div>
          {o.notes && <p className="text-xs text-muted-foreground mt-3 italic">"{o.notes}"</p>}
          <div className="flex gap-2 mt-3 flex-wrap">
            {o.status === "pending" && (
              <>
                <button onClick={() => setStatus(o.id, "confirmed")} className="text-xs px-3 py-1.5 rounded-full bg-gold text-primary-foreground">Xác nhận</button>
                <button onClick={() => setStatus(o.id, "cancelled")} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-destructive">Từ chối</button>
              </>
            )}
            {o.status === "confirmed" && (
              <button onClick={() => setStatus(o.id, "completed")} className="text-xs px-3 py-1.5 rounded-full border border-gold text-gold">Hoàn tất</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DealsTab({ restaurantId, deals, reload }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  async function save(d: any) {
    const { id, ...payload } = d;
    if (id) {
      const { error } = await supabase.from("deals").update(payload as any).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("deals").insert({ ...payload, restaurant_id: restaurantId } as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Đã lưu ưu đãi"); setEditing(null); reload();
  }
  async function remove(id: string) {
    if (!confirm("Xoá ưu đãi này?")) return;
    await supabase.from("deals").delete().eq("id", id); reload();
  }
  async function toggleActive(d: any) {
    await supabase.from("deals").update({ is_active: !d.is_active }).eq("id", d.id);
    reload();
  }
  return (
    <div>
      <button onClick={() => setEditing({ title: "", description: "", badge: "Mới", tag: "Ưu đãi", is_active: true })}
        className="mb-4 px-4 py-2 rounded-full border border-gold text-gold text-sm flex items-center gap-2">
        <Plus className="h-3 w-3" /> Thêm ưu đãi
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {deals.map((d: any) => (
          <div key={d.id} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex justify-between gap-3">
              {d.image_url && (
                <img src={d.image_url} alt={d.title} className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gold">{d.badge}</span>
                <h4 className="font-serif text-lg mt-1 truncate">{d.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                {d.expires_at && <p className="text-xs text-muted-foreground mt-2">Hết hạn: {new Date(d.expires_at).toLocaleDateString("vi-VN")}</p>}
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                <button onClick={() => toggleActive(d)} className={`text-xs px-2 py-1 rounded-full border ${d.is_active ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground"}`}>
                  {d.is_active ? "Đang hiện" : "Ẩn"}
                </button>
                <button onClick={() => setEditing(d)} className="text-xs text-muted-foreground hover:text-gold">Sửa</button>
                <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {deals.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Chưa có ưu đãi.</p>}
      </div>

      {editing && <DealModal deal={editing} restaurantId={restaurantId} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function DealModal({ deal, restaurantId, onClose, onSave }: any) {
  const [form, setForm] = useState<any>(deal);
  return (
    <div className="fixed inset-0 z-[60] bg-background/85 backdrop-blur overflow-y-auto p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-elegant my-8 mx-auto max-h-[calc(100vh-4rem)] overflow-y-auto">

        <h3 className="font-serif text-2xl mb-4">{form.id ? "Sửa ưu đãi" : "Thêm ưu đãi"}</h3>
        <div className="space-y-4">
          <div>
            <ImageUploader bucket="restaurant-images" folder={`${restaurantId}/deals`} label="Hình đại diện ưu đãi"
              value={form.image_url || ""} onChange={(url) => setForm({ ...form, image_url: url })} aspect="aspect-video" />
          </div>
          <Field label="Tiêu đề" value={form.title} onChange={(v: any) => setForm({ ...form, title: v })} />
          <Field label="Mô tả" textarea value={form.description} onChange={(v: any) => setForm({ ...form, description: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Huy hiệu" value={form.badge} onChange={(v: any) => setForm({ ...form, badge: v })} />
            <Field label="Nhãn" value={form.tag} onChange={(v: any) => setForm({ ...form, tag: v })} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Hết hạn (tuỳ chọn)</label>
            <input type="date" value={form.expires_at ? String(form.expires_at).slice(0, 10) : ""}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-background border border-border focus:border-gold outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-gold)]" />
            Đang hiển thị
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:border-gold">Hủy</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Lưu</button>
        </div>
      </div>
    </div>
  );
}

function mergeRow(cur: any[], payload: any, sortKey: string): any[] {
  if (payload.eventType === "DELETE") return cur.filter((x) => x.id !== payload.old?.id);
  const row = payload.new;
  if (!row) return cur;
  const exists = cur.some((x) => x.id === row.id);
  const next = exists ? cur.map((x) => (x.id === row.id ? { ...x, ...row } : x)) : [row, ...cur];
  return next.sort((a, b) => new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime());
}

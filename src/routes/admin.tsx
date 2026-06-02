import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Users, Store, CreditCard, CheckCircle2, XCircle, Star, Eye, EyeOff,
  ArrowRight, Calendar, Save, Plus, Trash2, Utensils, MapPin, Sparkles, Crown, Edit3,
  LayoutDashboard, FileText, Settings as SettingsIcon, Layout as LayoutIcon, FolderTree,
  Search, RefreshCw, Menu as MenuIcon, LogOut, Home, ChevronRight, Bell, TrendingUp,
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { toast } from "sonner";
import { invalidateSiteSettings } from "@/hooks/useSiteSettings";
import { BlogTab } from "@/components/admin/BlogTab";
import { notify } from "@/lib/notify.functions";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Maison Dining" }] }),
  component: AdminPage,
});

type Tab = "overview" | "restaurants" | "payments" | "plans" | "users" | "bookings" | "directory" | "site" | "blog" | "settings";

const NAV_GROUPS: { title: string; items: { k: Tab; label: string; icon: any }[] }[] = [
  {
    title: "Vận hành",
    items: [
      { k: "overview", label: "Tổng quan", icon: LayoutDashboard },
      { k: "payments", label: "Duyệt thanh toán", icon: CreditCard },
      { k: "bookings", label: "Đặt chỗ", icon: Calendar },
      { k: "restaurants", label: "Nhà hàng", icon: Store },
      { k: "users", label: "Người dùng", icon: Users },
    ],
  },
  {
    title: "Nội dung",
    items: [
      { k: "blog", label: "Blog", icon: FileText },
      { k: "directory", label: "Danh mục & Địa điểm", icon: FolderTree },
      { k: "site", label: "Header & Footer", icon: LayoutIcon },
    ],
  },
  {
    title: "Cấu hình",
    items: [
      { k: "plans", label: "Gói thành viên", icon: Crown },
      { k: "settings", label: "Hệ thống", icon: SettingsIcon },
    ],
  },
];

function AdminPage() {
  const { user, loading, hasRole, roles } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ restaurants: 0, users: 0, pending: 0, bookings: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function loadAll() {
    setRefreshing(true);
    const [r, p, pr, ur, b] = await Promise.all([
      supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
      supabase.from("membership_payments").select("*, restaurants(name, slug)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("bookings").select("*, restaurants(name)").order("created_at", { ascending: false }).limit(100),
    ]);
    setRestaurants(r.data ?? []);
    setPayments(p.data ?? []);
    setProfiles(pr.data ?? []);
    setUserRoles(ur.data ?? []);
    setBookings(b.data ?? []);
    setStats({
      restaurants: r.data?.length ?? 0,
      users: pr.data?.length ?? 0,
      pending: (p.data ?? []).filter((x: any) => x.status === "pending").length,
      bookings: b.data?.length ?? 0,
    });
    setLastSync(new Date());
    setRefreshing(false);
  }

  useEffect(() => {
    if (user && hasRole("admin")) loadAll();
  }, [user, roles.join(",")]);

  // Search filtering across the active tab
  const filteredRestaurants = useMemo(() => {
    if (!query) return restaurants;
    const q = query.toLowerCase();
    return restaurants.filter((r) => [r.name, r.slug, r.city, r.cuisine_type].some((v) => v?.toLowerCase().includes(q)));
  }, [restaurants, query]);
  const filteredPayments = useMemo(() => {
    if (!query) return payments;
    const q = query.toLowerCase();
    return payments.filter((p) => [p.restaurants?.name, p.plan_name, p.status].some((v) => v?.toLowerCase().includes(q)));
  }, [payments, query]);
  const filteredUsers = useMemo(() => {
    if (!query) return profiles;
    const q = query.toLowerCase();
    return profiles.filter((u) => [u.full_name, u.phone, u.id].some((v) => v?.toLowerCase().includes(q)));
  }, [profiles, query]);
  const filteredBookings = useMemo(() => {
    if (!query) return bookings;
    const q = query.toLowerCase();
    return bookings.filter((b) => [b.restaurants?.name, b.guest_name, b.guest_phone, b.status].some((v) => v?.toLowerCase().includes(q)));
  }, [bookings, query]);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return null;
  if (!hasRole("admin")) {
    async function claim() {
      const { data, error } = await supabase.rpc("claim_admin_if_none");
      if (error) return toast.error(error.message);
      if (data) { toast.success("Đã cấp quyền admin cho tài khoản này"); window.location.reload(); }
      else toast.error("Hệ thống đã có admin. Liên hệ admin hiện tại để được cấp quyền.");
    }
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-32 max-w-2xl mx-auto px-6 text-center">
          <Shield className="h-12 w-12 mx-auto text-gold mb-4" />
          <h1 className="font-serif text-3xl mb-3">Khu vực hạn chế</h1>
          <p className="text-muted-foreground mb-6">
            Tài khoản của bạn không có quyền quản trị. Nếu bạn là người thiết lập đầu tiên, hãy nhận quyền admin bên dưới.
          </p>
          <button onClick={claim} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold">
            Nhận quyền Admin (chỉ user đầu tiên)
          </button>
          <p className="text-xs text-muted-foreground/70 font-mono break-all mt-6">User ID: {user.id}</p>
          <Link to="/" className="inline-block mt-6 text-gold hover:underline">← Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const notifyFn = useServerFn(notify);

  async function approvePayment(p: any) {
    const { error } = await supabase
      .from("membership_payments")
      .update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Đã duyệt thanh toán & kích hoạt gói");
    notifyFn({ data: { type: "payment_approved", paymentId: p.id } }).catch(() => {});
    loadAll();
  }

  async function rejectPayment(p: any) {
    const { error } = await supabase
      .from("membership_payments")
      .update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Đã từ chối");
    notifyFn({ data: { type: "payment_rejected", paymentId: p.id } }).catch(() => {});
    loadAll();
  }


  async function toggleFeatured(r: any) {
    const { error } = await supabase.from("restaurants").update({ is_featured: !r.is_featured }).eq("id", r.id);
    if (error) return toast.error(error.message);
    loadAll();
  }

  async function togglePublished(r: any) {
    const { error } = await supabase.from("restaurants").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    loadAll();
  }

  async function setRole(uid: string, role: "admin" | "restaurant_owner" | "customer", add: boolean) {
    if (add) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    }
    loadAll();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const activeMeta = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.k === tab)!;
  const totalRevenue = payments.filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount || 0), 0);
  const activeRestaurants = restaurants.filter((r) => r.membership_status === "active").length;
  const trialRestaurants = restaurants.filter((r) => r.membership_status === "trial").length;
  const todayBookings = bookings.filter((b) => {
    if (!b.booking_at) return false;
    const d = new Date(b.booking_at);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  }).length;

  // Time-series for charts: last 14 days
  const series = useMemo(() => {
    const days: { key: string; label: string; bookings: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, bookings: 0, revenue: 0 });
    }
    const idx: Record<string, number> = {};
    days.forEach((d, i) => (idx[d.key] = i));
    bookings.forEach((b) => {
      const k = (b.created_at || "").slice(0, 10);
      if (k in idx) days[idx[k]].bookings += 1;
    });
    payments.forEach((p) => {
      if (p.status !== "approved") return;
      const k = (p.reviewed_at || p.created_at || "").slice(0, 10);
      if (k in idx) days[idx[k]].revenue += Number(p.amount || 0);
    });
    return days;
  }, [bookings, payments]);

  const showSearch = ["restaurants", "payments", "users", "bookings"].includes(tab);

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} ${mobileNav ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed md:sticky top-0 z-40 h-screen border-r border-border bg-card transition-all duration-200 flex flex-col`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
          {sidebarOpen ? (
            <Link to="/" className="flex items-center gap-2 group">
              <Shield className="h-5 w-5 text-gold" />
              <span className="font-serif text-lg">Maison <span className="text-gold">Admin</span></span>
            </Link>
          ) : (
            <Shield className="h-5 w-5 text-gold mx-auto" />
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {NAV_GROUPS.map((g) => (
            <div key={g.title}>
              {sidebarOpen && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{g.title}</div>
              )}
              <div className="space-y-1">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = tab === it.k;
                  const badge = it.k === "payments" && stats.pending > 0 ? stats.pending : null;
                  return (
                    <button
                      key={it.k}
                      onClick={() => { setTab(it.k); setMobileNav(false); setQuery(""); }}
                      title={!sidebarOpen ? it.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition relative ${
                        active
                          ? "bg-gradient-gold text-primary-foreground shadow-gold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && <span className="flex-1 text-left truncate">{it.label}</span>}
                      {badge !== null && (
                        sidebarOpen ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${active ? "bg-background/20 text-primary-foreground" : "bg-gold text-primary-foreground"}`}>{badge}</span>
                        ) : (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3 shrink-0">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="px-2 py-2 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground">Đăng nhập</div>
                <div className="text-sm font-medium truncate">{user.email}</div>
              </div>
              <div className="flex gap-1">
                <Link to="/" className="flex-1 px-2 py-1.5 rounded-md text-xs hover:bg-muted inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Home className="h-3 w-3" /> Trang chủ
                </Link>
                <button onClick={signOut} className="flex-1 px-2 py-1.5 rounded-md text-xs hover:bg-muted inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-destructive">
                  <LogOut className="h-3 w-3" /> Thoát
                </button>
              </div>
            </div>
          ) : (
            <button onClick={signOut} className="w-full p-2 text-muted-foreground hover:text-destructive flex justify-center">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileNav && (
        <div onClick={() => setMobileNav(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" />
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border px-4 md:px-6 flex items-center gap-3">
          <button onClick={() => setMobileNav(true)} className="md:hidden p-2 -ml-2 text-muted-foreground"><MenuIcon className="h-5 w-5" /></button>
          <button onClick={() => setSidebarOpen((v) => !v)} className="hidden md:inline-flex p-2 -ml-2 text-muted-foreground hover:text-foreground"><MenuIcon className="h-5 w-5" /></button>

          <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-gold" />
            <span>Quản trị</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{activeMeta.label}</span>
          </div>

          <div className="flex-1" />

          {showSearch && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Tìm trong ${activeMeta.label.toLowerCase()}…`}
                className="bg-background border border-border rounded-full pl-9 pr-4 py-2 text-sm w-56 lg:w-72 focus:outline-none focus:border-gold transition"
              />
            </div>
          )}

          <button
            onClick={loadAll}
            disabled={refreshing}
            title={lastSync ? `Cập nhật lúc ${lastSync.toLocaleTimeString("vi-VN")}` : "Làm mới"}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <div className="relative">
            <button onClick={() => setTab("payments")} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
              <Bell className="h-4 w-4" />
              {stats.pending > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold animate-pulse" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-6 max-w-[1600px] w-full mx-auto">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl">{activeMeta.label}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{descOf(tab)}</p>
            </div>
            {lastSync && (
              <div className="text-xs text-muted-foreground">
                Cập nhật: {lastSync.toLocaleTimeString("vi-VN")}
              </div>
            )}
          </div>

          {/* Mobile search */}
          {showSearch && (
            <div className="sm:hidden mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm…"
                className="w-full bg-card border border-border rounded-full pl-9 pr-4 py-2 text-sm" />
            </div>
          )}

          {tab === "overview" && (
            <div className="space-y-6">
              {/* KPI grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={<Store className="h-4 w-4" />} label="Nhà hàng đang hoạt động" value={activeRestaurants} hint={`${trialRestaurants} dùng thử`} />
                <KpiCard icon={<Users className="h-4 w-4" />} label="Người dùng" value={stats.users} hint={`${restaurants.length} đối tác`} />
                <KpiCard icon={<CreditCard className="h-4 w-4" />} label="Chờ duyệt" value={stats.pending} highlight={stats.pending > 0} hint={stats.pending > 0 ? "Cần xử lý" : "Đã sạch"} />
                <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Doanh thu (đã duyệt)" value={`${(totalRevenue / 1_000_000).toFixed(1)}M`} hint={`${todayBookings} đặt chỗ hôm nay`} />
              </div>

              {/* Quick actions */}
              <Panel title="Thao tác nhanh">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <QuickAction icon={<CreditCard className="h-4 w-4" />} label="Duyệt thanh toán" badge={stats.pending} onClick={() => setTab("payments")} />
                  <QuickAction icon={<Store className="h-4 w-4" />} label="Quản lý nhà hàng" onClick={() => setTab("restaurants")} />
                  <QuickAction icon={<FileText className="h-4 w-4" />} label="Viết bài blog" onClick={() => setTab("blog")} />
                  <QuickAction icon={<Crown className="h-4 w-4" />} label="Cấu hình gói" onClick={() => setTab("plans")} />
                </div>
              </Panel>

              {/* Time-series analytics */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Panel title="Doanh thu thành viên (14 ngày)">
                  <div className="h-56 -ml-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--gold, 42 70% 55%))" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="hsl(var(--gold, 42 70% 55%))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${v / 1000}K` : String(v)} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any) => [`${Number(v).toLocaleString("vi-VN")} ₫`, "Doanh thu"]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--gold, 42 70% 55%))" fill="url(#rev)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border mt-2">
                    <span>Tổng 14 ngày</span>
                    <span className="font-mono text-foreground">{series.reduce((s, d) => s + d.revenue, 0).toLocaleString("vi-VN")} ₫</span>
                  </div>
                </Panel>

                <Panel title="Đặt chỗ theo ngày (14 ngày)">
                  <div className="h-56 -ml-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any) => [v, "Đặt chỗ"]}
                        />
                        <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border mt-2">
                    <span>Tổng 14 ngày</span>
                    <span className="font-mono text-foreground">{series.reduce((s, d) => s + d.bookings, 0)} đặt chỗ</span>
                  </div>
                </Panel>
              </div>



              <div className="grid lg:grid-cols-2 gap-6">
                <Panel title="Thanh toán chờ duyệt" action={
                  <button onClick={() => setTab("payments")} className="text-xs text-gold inline-flex items-center gap-1">Tất cả <ArrowRight className="h-3 w-3" /></button>
                }>
                  {payments.filter((p) => p.status === "pending").slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.restaurants?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{p.plan_name} · {Number(p.amount).toLocaleString("vi-VN")} đ</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => approvePayment(p)} className="text-[11px] px-2.5 py-1 rounded-md bg-gold/15 text-gold hover:bg-gold/25"><CheckCircle2 className="h-3 w-3 inline" /> Duyệt</button>
                        <button onClick={() => rejectPayment(p)} className="text-[11px] px-2.5 py-1 rounded-md border border-border hover:border-destructive hover:text-destructive"><XCircle className="h-3 w-3 inline" /></button>
                      </div>
                    </div>
                  ))}
                  {payments.filter((p) => p.status === "pending").length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Không còn thanh toán chờ duyệt.</p>
                  )}
                </Panel>

                <Panel title="Đặt chỗ gần đây" action={
                  <button onClick={() => setTab("bookings")} className="text-xs text-gold inline-flex items-center gap-1">Tất cả <ArrowRight className="h-3 w-3" /></button>
                }>
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{b.guest_name} · {b.party_size} khách</div>
                        <div className="text-xs text-muted-foreground truncate">{b.restaurants?.name ?? "—"} · {fmtDate(b.booking_at)}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-card border border-border shrink-0">{b.status}</span>
                    </div>
                  ))}
                  {bookings.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa có đặt chỗ.</p>}
                </Panel>

                <Panel title="Nhà hàng mới">
                  {restaurants.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.cuisine_type ?? "—"} · {r.city ?? "—"}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badgeFor(r.membership_status)}`}>{r.membership_status}</span>
                    </div>
                  ))}
                </Panel>

                <Panel title="Phân bổ nhà hàng">
                  <div className="space-y-3">
                    <DistRow label="Đang hoạt động" value={activeRestaurants} total={restaurants.length} color="bg-emerald-500" />
                    <DistRow label="Dùng thử" value={trialRestaurants} total={restaurants.length} color="bg-gold" />
                    <DistRow label="Hết hạn" value={restaurants.filter((r) => r.membership_status === "expired").length} total={restaurants.length} color="bg-destructive" />
                    <DistRow label="Đã xuất bản" value={restaurants.filter((r) => r.is_published).length} total={restaurants.length} color="bg-primary" />
                    <DistRow label="Nổi bật" value={restaurants.filter((r) => r.is_featured).length} total={restaurants.length} color="bg-gold" />
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {tab === "restaurants" && (
            <Table head={["Tên", "Loại", "TP", "Gói", "Hết hạn", "Hiển thị", "Nổi bật", ""]}>
              {filteredRestaurants.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                  <td className="py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">/{r.slug}</div>
                  </td>
                  <td className="text-sm text-muted-foreground">{r.cuisine_type ?? "—"}</td>
                  <td className="text-sm text-muted-foreground">{r.city ?? "—"}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full ${badgeFor(r.membership_status)}`}>{r.membership_status}</span></td>
                  <td className="text-xs text-muted-foreground">{fmtDate(r.membership_ends_at ?? r.trial_ends_at)}</td>
                  <td>
                    <button onClick={() => togglePublished(r)} className="text-muted-foreground hover:text-gold">
                      {r.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => toggleFeatured(r)}>
                      <Star className={`h-4 w-4 ${r.is_featured ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                    </button>
                  </td>
                  <td>
                    <Link to="/r/$slug" params={{ slug: r.slug }} className="text-xs text-gold hover:underline">Xem</Link>
                  </td>
                </tr>
              ))}
              {filteredRestaurants.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Không có nhà hàng phù hợp.</td></tr>
              )}
            </Table>
          )}

          {tab === "payments" && (
            <Table head={["Nhà hàng", "Gói", "Số tiền", "Ngày", "Chứng từ", "Trạng thái", "Hành động"]}>
              {filteredPayments.map((p) => (
                <tr key={p.id} className="border-b border-border align-top hover:bg-muted/30">
                  <td className="py-3 font-medium">{p.restaurants?.name ?? "—"}</td>
                  <td className="text-sm">{p.plan_name}<div className="text-xs text-muted-foreground">{p.duration_days} ngày</div></td>
                  <td className="text-sm">{Number(p.amount).toLocaleString("vi-VN")} đ</td>
                  <td className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                  <td>
                    {p.proof_image_url ? (
                      <a href={p.proof_image_url} target="_blank" className="text-xs text-gold hover:underline">Xem ảnh</a>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                    {p.note && <div className="text-xs text-muted-foreground mt-1 max-w-[200px]">{p.note}</div>}
                  </td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full ${payBadge(p.status)}`}>{p.status}</span></td>
                  <td>
                    {p.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => approvePayment(p)} className="text-xs px-3 py-1.5 rounded-md bg-gold text-primary-foreground hover:opacity-90 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Duyệt
                        </button>
                        <button onClick={() => rejectPayment(p)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-destructive hover:text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Từ chối
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{fmtDate(p.reviewed_at)}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chưa có thanh toán nào.</td></tr>
              )}
            </Table>
          )}

          {tab === "users" && (
            <Table head={["Tên", "Số ĐT", "Vai trò", "Ngày tạo", "Quyền"]}>
              {filteredUsers.map((u) => {
                const userR = userRoles.filter((x) => x.user_id === u.id).map((x) => x.role);
                return (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3">
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</div>
                    </td>
                    <td className="text-sm text-muted-foreground">{u.phone ?? "—"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {userR.map((r) => <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{r}</span>)}
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {(["admin", "restaurant_owner"] as const).map((role) => {
                          const has = userR.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => setRole(u.id, role, !has)}
                              className={`text-xs px-2 py-1 rounded-md border ${has ? "border-gold text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}
                            >
                              {has ? "− " : "+ "}{role === "admin" ? "Admin" : "Owner"}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Không có người dùng phù hợp.</td></tr>
              )}
            </Table>
          )}

          {tab === "bookings" && (
            <Table head={["Nhà hàng", "Khách", "SĐT", "Số người", "Thời gian", "Trạng thái"]}>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="border-b border-border hover:bg-muted/30">
                  <td className="py-3 font-medium">{b.restaurants?.name ?? "—"}</td>
                  <td className="text-sm">{b.guest_name}</td>
                  <td className="text-sm text-muted-foreground">{b.guest_phone}</td>
                  <td className="text-sm">{b.party_size}</td>
                  <td className="text-xs text-muted-foreground">{fmtDate(b.booking_at)}</td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{b.status}</span></td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Không có đặt chỗ phù hợp.</td></tr>
              )}
            </Table>
          )}

          {tab === "directory" && <DirectoryTab />}
          {tab === "plans" && <PlansTab />}
          {tab === "site" && <SiteTab />}
          {tab === "blog" && <BlogTab />}
          {tab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, hint, highlight }: any) {
  return (
    <div className={`rounded-2xl border p-5 transition ${highlight ? "border-gold/40 bg-gold/5" : "border-border bg-card hover:border-gold/30"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-3">
        <span className={highlight ? "text-gold" : ""}>{icon}</span>
        {label}
      </div>
      <div className="font-serif text-3xl">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function QuickAction({ icon, label, onClick, badge }: any) {
  return (
    <button onClick={onClick} className="relative rounded-xl border border-border bg-card hover:border-gold/40 hover:bg-gold/5 px-4 py-4 text-left transition">
      <div className="flex items-center gap-2 mb-2 text-gold">{icon}</div>
      <div className="text-sm font-medium">{label}</div>
      {badge ? <span className="absolute top-2 right-2 text-[10px] bg-gold text-primary-foreground rounded-full px-1.5 py-0.5 font-medium">{badge}</span> : null}
    </button>
  );
}

function DistRow({ label, value, total, color }: any) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, children, action }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Table({ head, children }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-muted/30">
          <tr className="border-b border-border">
            {head.map((h: string) => <th key={h} className="text-left font-medium px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_td]:px-4">{children}</tbody>
      </table>
    </div>
  );
}

function descOf(t: Tab) {
  return ({
    overview: "Tình hình vận hành tổng thể của hệ thống Maison Dining.",
    restaurants: "Toàn bộ nhà hàng đã đăng ký, trạng thái hiển thị và gói thành viên.",
    payments: "Duyệt hoặc từ chối thanh toán gói thành viên từ đối tác.",
    plans: "Tạo và quản lý các gói thành viên hiển thị cho nhà hàng.",
    users: "Quản lý người dùng và phân quyền hệ thống.",
    bookings: "Lịch sử đặt chỗ trên toàn bộ nhà hàng.",
    directory: "Danh mục ẩm thực, địa điểm, tiện ích dùng cho tìm kiếm và bộ lọc.",
    site: "Cấu hình thương hiệu, menu header và các cột footer.",
    blog: "Quản lý bài viết, danh mục và xuất bản nội dung blog.",
    settings: "Email thông báo, QR thanh toán, cấu hình hệ thống khác.",
  } as Record<Tab, string>)[t];
}

function SettingsTab() {
  const [pay, setPay] = useState<any>({ qr_image_url: "", bank_name: "", account_no: "", account_holder: "", instructions: "" });
  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("payment_settings").select("*").eq("id", true).maybeSingle();
      if (p) setPay(p);
    })();
  }, []);
  async function savePay() {
    const { error } = await supabase.from("payment_settings").update({
      qr_image_url: pay.qr_image_url, bank_name: pay.bank_name, account_no: pay.account_no,
      account_holder: pay.account_holder, instructions: pay.instructions, updated_at: new Date().toISOString(),
    }).eq("id", true);
    if (error) return toast.error(error.message);
    toast.success("Đã lưu thông tin thanh toán");
  }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Panel title="Email thông báo (Resend)">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            API key Resend hiện được lưu an toàn trong <b>Lovable Cloud → Secrets</b> dưới tên <code className="text-gold">RESEND_API_KEY</code>
            (và <code className="text-gold">RESEND_FROM</code> tuỳ chọn cho địa chỉ gửi).
          </p>
          <p>
            Để cập nhật key, vào mục Secrets của dự án — không còn lưu trong cơ sở dữ liệu để giảm rủi ro lộ key.
          </p>
        </div>
      </Panel>
      <Panel title="QR thanh toán gói thành viên">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Ảnh QR</label>
            <ImageUploader bucket="restaurant-images" folder="settings" value={pay.qr_image_url || null}
              onChange={(url) => setPay({ ...pay, qr_image_url: url ?? "" })} aspect="aspect-square" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Ngân hàng" value={pay.bank_name ?? ""} onChange={(e) => setPay({ ...pay, bank_name: e.target.value })}
              className="bg-background border border-border rounded-md px-3 py-2" />
            <input placeholder="Số tài khoản" value={pay.account_no ?? ""} onChange={(e) => setPay({ ...pay, account_no: e.target.value })}
              className="bg-background border border-border rounded-md px-3 py-2" />
          </div>
          <input placeholder="Chủ tài khoản" value={pay.account_holder ?? ""} onChange={(e) => setPay({ ...pay, account_holder: e.target.value })}
            className="w-full bg-background border border-border rounded-md px-3 py-2" />
          <textarea placeholder="Hướng dẫn / nội dung chuyển khoản" rows={3} value={pay.instructions ?? ""}
            onChange={(e) => setPay({ ...pay, instructions: e.target.value })}
            className="w-full bg-background border border-border rounded-md px-3 py-2" />
          <button onClick={savePay} className="px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2">
            <Save className="h-3 w-3" /> Lưu
          </button>
        </div>
      </Panel>
    </div>
  );
}

function badgeFor(s: string) {
  return {
    trial: "bg-gold/15 text-gold border border-gold/30",
    active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    expired: "bg-destructive/15 text-destructive border border-destructive/30",
    pending: "bg-muted text-muted-foreground border border-border",
  }[s] ?? "bg-card border border-border";
}

function payBadge(s: string) {
  return {
    pending: "bg-gold/15 text-gold border border-gold/30",
    approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    rejected: "bg-destructive/15 text-destructive border border-destructive/30",
  }[s] ?? "bg-card";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function DirectoryTab() {
  const [cuisines, setCuisines] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [newCuisine, setNewCuisine] = useState({ name: "", icon: "Utensils" });
  const [newLocation, setNewLocation] = useState("");
  const [newAmenity, setNewAmenity] = useState({ name: "", icon: "Sparkles" });

  async function load() {
    const [{ data: cu }, { data: lo }, { data: am }] = await Promise.all([
      supabase.from("cuisine_categories").select("*").order("sort_order"),
      supabase.from("locations").select("*").order("sort_order"),
      supabase.from("amenities").select("*").order("sort_order"),
    ]);
    setCuisines(cu ?? []); setLocations(lo ?? []); setAmenitiesList(am ?? []);
  }
  useEffect(() => { load(); }, []);

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function addCuisine() {
    if (!newCuisine.name.trim()) return;
    const { error } = await supabase.from("cuisine_categories").insert({
      name: newCuisine.name.trim(), slug: slugify(newCuisine.name), icon: newCuisine.icon || null,
      sort_order: cuisines.length + 1,
    });
    if (error) return toast.error(error.message);
    setNewCuisine({ name: "", icon: "Utensils" }); load();
  }
  async function removeCuisine(id: string) {
    if (!confirm("Xoá danh mục này?")) return;
    await supabase.from("cuisine_categories").delete().eq("id", id); load();
  }
  async function toggleCuisine(c: any) {
    await supabase.from("cuisine_categories").update({ is_active: !c.is_active }).eq("id", c.id); load();
  }
  async function addLocation() {
    if (!newLocation.trim()) return;
    const { error } = await supabase.from("locations").insert({
      name: newLocation.trim(), slug: slugify(newLocation), sort_order: locations.length + 1,
    });
    if (error) return toast.error(error.message);
    setNewLocation(""); load();
  }
  async function removeLocation(id: string) {
    if (!confirm("Xoá địa điểm này?")) return;
    await supabase.from("locations").delete().eq("id", id); load();
  }
  async function toggleLocation(l: any) {
    await supabase.from("locations").update({ is_active: !l.is_active }).eq("id", l.id); load();
  }
  async function addAmenity() {
    if (!newAmenity.name.trim()) return;
    const { error } = await supabase.from("amenities").insert({
      name: newAmenity.name.trim(), slug: slugify(newAmenity.name), icon: newAmenity.icon || null,
      sort_order: amenitiesList.length + 1,
    });
    if (error) return toast.error(error.message);
    setNewAmenity({ name: "", icon: "Sparkles" }); load();
  }
  async function removeAmenity(id: string) {
    if (!confirm("Xoá tiện ích này?")) return;
    await supabase.from("amenities").delete().eq("id", id); load();
  }
  async function toggleAmenity(a: any) {
    await supabase.from("amenities").update({ is_active: !a.is_active }).eq("id", a.id); load();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Panel title={<span className="flex items-center gap-2"><Utensils className="h-4 w-4 text-gold" /> Danh mục nhà hàng</span> as any}>
        <div className="flex gap-2 mb-4">
          <input value={newCuisine.name} onChange={(e) => setNewCuisine({ ...newCuisine, name: e.target.value })}
            placeholder="Tên danh mục (vd: Hải sản cao cấp)" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input value={newCuisine.icon} onChange={(e) => setNewCuisine({ ...newCuisine, icon: e.target.value })}
            placeholder="Icon (Lucide)" className="w-32 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono" />
          <button onClick={addCuisine} className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">Icon dùng tên từ lucide.dev (vd: Utensils, Fish, Beef, Wine, Pizza, Soup, ChefHat).</p>
        <div className="space-y-2">
          {cuisines.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-card/50">
              <span className="text-xs text-muted-foreground font-mono w-20 truncate">{c.icon ?? "—"}</span>
              <span className={`flex-1 font-serif ${c.is_active ? "" : "line-through text-muted-foreground"}`}>{c.name}</span>
              <button onClick={() => toggleCuisine(c)} className="text-xs text-muted-foreground hover:text-gold">
                {c.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => removeCuisine(c.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {cuisines.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa có danh mục.</p>}
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Địa điểm</span> as any}>
        <div className="flex gap-2 mb-4">
          <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLocation(); } }}
            placeholder="Tên địa điểm (vd: Nha Trang)" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <button onClick={addLocation} className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        <div className="space-y-2">
          {locations.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-card/50">
              <span className={`flex-1 font-serif ${l.is_active ? "" : "line-through text-muted-foreground"}`}>{l.name}</span>
              <button onClick={() => toggleLocation(l)} className="text-xs text-muted-foreground hover:text-gold">
                {l.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => removeLocation(l.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {locations.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa có địa điểm.</p>}
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" /> Tiện ích nhà hàng</span> as any}>
        <div className="flex gap-2 mb-4">
          <input value={newAmenity.name} onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
            placeholder="Tên tiện ích (vd: Phòng VIP)" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input value={newAmenity.icon} onChange={(e) => setNewAmenity({ ...newAmenity, icon: e.target.value })}
            placeholder="Icon (Lucide)" className="w-32 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono" />
          <button onClick={addAmenity} className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">Tiện ích sẽ xuất hiện trong thanh tìm kiếm và bộ lọc nhà hàng.</p>
        <div className="space-y-2">
          {amenitiesList.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-card/50">
              <span className="text-xs text-muted-foreground font-mono w-20 truncate">{a.icon ?? "—"}</span>
              <span className={`flex-1 font-serif ${a.is_active ? "" : "line-through text-muted-foreground"}`}>{a.name}</span>
              <button onClick={() => toggleAmenity(a)} className="text-xs text-muted-foreground hover:text-gold">
                {a.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => removeAmenity(a.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {amenitiesList.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa có tiện ích.</p>}
        </div>
      </Panel>
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const empty = { name: "", slug: "", tagline: "", duration_days: 30, price: 0, max_restaurants: 1, perks: [] as string[], is_popular: false, is_active: true, sort_order: 0 };

  async function load() {
    const { data } = await supabase.from("membership_plans").select("*").order("sort_order");
    setPlans(data ?? []);
  }
  useEffect(() => { load(); }, []);

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name?.trim(),
      slug: (editing.slug?.trim() || slugify(editing.name || "")),
      tagline: editing.tagline || null,
      duration_days: Number(editing.duration_days) || 30,
      price: Number(editing.price) || 0,
      max_restaurants: Math.max(1, Number(editing.max_restaurants) || 1),
      perks: (editing.perks ?? []).filter((p: string) => p && p.trim()),
      is_popular: !!editing.is_popular,
      is_active: editing.is_active !== false,
      sort_order: Number(editing.sort_order) || 0,
    };
    if (!payload.name) return toast.error("Nhập tên gói");
    if (editing.id) {
      const { error } = await supabase.from("membership_plans").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("membership_plans").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Đã lưu gói");
    setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm("Xoá gói này?")) return;
    const { error } = await supabase.from("membership_plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function toggle(p: any) {
    await supabase.from("membership_plans").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl flex items-center gap-2"><Crown className="h-5 w-5 text-gold" /> Gói thành viên</h2>
          <p className="text-sm text-muted-foreground mt-1">Tạo, chỉnh sửa và quản lý các gói thành viên hiển thị cho nhà hàng.</p>
        </div>
        <button onClick={() => setEditing({ ...empty, sort_order: plans.length + 1 })}
          className="px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm gói mới
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className={`relative rounded-2xl border p-6 ${p.is_active ? "border-border bg-card" : "border-border/40 bg-card/40 opacity-70"} ${p.is_popular ? "ring-1 ring-gold/40" : ""}`}>
            {p.is_popular && <span className="absolute -top-2 right-4 text-[10px] px-2 py-0.5 rounded-full bg-gradient-gold text-primary-foreground uppercase tracking-wider">Phổ biến</span>}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-serif text-xl">{p.name}</div>
                <div className="text-xs text-muted-foreground">/{p.slug}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggle(p)} className="text-muted-foreground hover:text-gold p-1">
                  {p.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => setEditing({ ...p })} className="text-muted-foreground hover:text-gold p-1"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {p.tagline && <p className="text-xs text-muted-foreground mt-1">{p.tagline}</p>}
            <div className="mt-3 mb-3">
              <span className="font-serif text-2xl text-gold">{Number(p.price).toLocaleString("vi-VN")}đ</span>
              <span className="text-muted-foreground text-xs"> / {p.duration_days} ngày</span>
              <div className="text-xs text-muted-foreground mt-1">Tối đa {p.max_restaurants ?? 1} nhà hàng</div>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {(p.perks ?? []).map((perk: string, i: number) => (
                <li key={i} className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-gold mt-0.5 shrink-0" />{perk}</li>
              ))}
            </ul>
          </div>
        ))}
        {plans.length === 0 && <p className="text-sm text-muted-foreground italic md:col-span-3">Chưa có gói nào. Bấm "Thêm gói mới" để bắt đầu.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-xl">{editing.id ? "Chỉnh sửa gói" : "Tạo gói mới"}</h3>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Tên gói *</label>
                  <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Slug</label>
                  <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="tự tạo từ tên" className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Mô tả ngắn</label>
                <input value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Giá (VND)</label>
                  <input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Thời hạn (ngày)</label>
                  <input type="number" value={editing.duration_days ?? 30} onChange={(e) => setEditing({ ...editing, duration_days: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Số nhà hàng tối đa</label>
                  <input type="number" min={1} value={editing.max_restaurants ?? 1} onChange={(e) => setEditing({ ...editing, max_restaurants: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Thứ tự</label>
                  <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Quyền lợi (mỗi dòng một mục)</label>
                <textarea value={(editing.perks ?? []).join("\n")}
                  onChange={(e) => setEditing({ ...editing, perks: e.target.value.split("\n") })}
                  rows={6}
                  placeholder="Trang landing đầy đủ&#10;Nhận đặt chỗ không giới hạn&#10;…"
                  className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.is_popular} onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })} />
                  <span className="text-sm">Đánh dấu "Phổ biến"</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  <span className="text-sm">Đang hoạt động</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-md border border-border text-sm">Huỷ</button>
              <button onClick={save} className="px-5 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2">
                <Save className="h-3 w-3" /> Lưu gói
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteTab() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
      setS(data ?? null);
    })();
  }, []);

  if (!s) return <div className="text-sm text-muted-foreground">Đang tải…</div>;

  function update(patch: any) { setS({ ...s, ...patch }); }
  function updateNavAt(i: number, patch: any) {
    const next = [...(s.header_nav ?? [])];
    next[i] = { ...next[i], ...patch };
    update({ header_nav: next });
  }
  function removeNav(i: number) {
    const next = [...(s.header_nav ?? [])]; next.splice(i, 1); update({ header_nav: next });
  }
  function addNav() {
    update({ header_nav: [...(s.header_nav ?? []), { label: "Mới", to: "/" }] });
  }
  function updateCol(ci: number, patch: any) {
    const next = [...(s.footer_columns ?? [])]; next[ci] = { ...next[ci], ...patch }; update({ footer_columns: next });
  }
  function updateColLink(ci: number, li: number, patch: any) {
    const next = [...(s.footer_columns ?? [])];
    const links = [...(next[ci].links ?? [])];
    links[li] = { ...links[li], ...patch };
    next[ci] = { ...next[ci], links };
    update({ footer_columns: next });
  }
  function removeColLink(ci: number, li: number) {
    const next = [...(s.footer_columns ?? [])];
    const links = [...(next[ci].links ?? [])]; links.splice(li, 1);
    next[ci] = { ...next[ci], links }; update({ footer_columns: next });
  }
  function addColLink(ci: number) {
    const next = [...(s.footer_columns ?? [])];
    const links = [...(next[ci].links ?? []), { label: "Mới", to: "/" }];
    next[ci] = { ...next[ci], links }; update({ footer_columns: next });
  }
  function addCol() {
    update({ footer_columns: [...(s.footer_columns ?? []), { title: "Cột mới", links: [] }] });
  }
  function removeCol(ci: number) {
    const next = [...(s.footer_columns ?? [])]; next.splice(ci, 1); update({ footer_columns: next });
  }
  function updateBottom(i: number, patch: any) {
    const next = [...(s.bottom_links ?? [])]; next[i] = { ...next[i], ...patch }; update({ bottom_links: next });
  }
  function removeBottom(i: number) {
    const next = [...(s.bottom_links ?? [])]; next.splice(i, 1); update({ bottom_links: next });
  }
  function addBottom() {
    update({ bottom_links: [...(s.bottom_links ?? []), { label: "Mới", to: "/" }] });
  }

  async function save() {
    const { error } = await supabase.from("site_settings").update({
      brand_name: s.brand_name,
      brand_tagline: s.brand_tagline,
      contact_email: s.contact_email,
      header_nav: s.header_nav,
      footer_columns: s.footer_columns,
      socials: s.socials,
      copyright: s.copyright,
      bottom_links: s.bottom_links,
      updated_at: new Date().toISOString(),
    }).eq("id", true);
    if (error) return toast.error(error.message);
    toast.success("Đã lưu cấu hình header/footer");
    invalidateSiteSettings();
  }

  const inputCls = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <Panel title="Thương hiệu">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Tên thương hiệu</label>
            <input className={inputCls} value={s.brand_name ?? ""} onChange={(e) => update({ brand_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Email liên hệ</label>
            <input className={inputCls} value={s.contact_email ?? ""} onChange={(e) => update({ contact_email: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Mô tả ngắn (footer)</label>
            <textarea rows={2} className={inputCls} value={s.brand_tagline ?? ""} onChange={(e) => update({ brand_tagline: e.target.value })} />
          </div>
        </div>
      </Panel>

      <Panel title="Menu trên cùng (Header)">
        <div className="space-y-2">
          {(s.header_nav ?? []).map((n: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inputCls + " flex-1"} placeholder="Nhãn" value={n.label} onChange={(e) => updateNavAt(i, { label: e.target.value })} />
              <input className={inputCls + " flex-[2]"} placeholder="/đường-dẫn hoặc https://…" value={n.to} onChange={(e) => updateNavAt(i, { to: e.target.value })} />
              <button onClick={() => removeNav(i)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Xoá">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={addNav} className="text-xs text-gold inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Thêm mục</button>
        </div>
      </Panel>

      <Panel title="Các cột liên kết ở Footer">
        <p className="text-xs text-muted-foreground mb-3">Hiện 2 cột đầu tiên trên trang. Cột thứ 3 (Theo dõi) lấy từ Mạng xã hội bên dưới.</p>
        <div className="space-y-4">
          {(s.footer_columns ?? []).map((col: any, ci: number) => (
            <div key={ci} className="rounded-xl border border-border p-3">
              <div className="flex gap-2 items-center mb-2">
                <input className={inputCls + " flex-1"} placeholder="Tiêu đề cột" value={col.title}
                  onChange={(e) => updateCol(ci, { title: e.target.value })} />
                <button onClick={() => removeCol(ci)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Xoá cột">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 pl-2 border-l border-border">
                {(col.links ?? []).map((l: any, li: number) => (
                  <div key={li} className="flex gap-2 items-center">
                    <input className={inputCls + " flex-1"} placeholder="Nhãn" value={l.label} onChange={(e) => updateColLink(ci, li, { label: e.target.value })} />
                    <input className={inputCls + " flex-[2]"} placeholder="/đường-dẫn hoặc https://…" value={l.to} onChange={(e) => updateColLink(ci, li, { to: e.target.value })} />
                    <button onClick={() => removeColLink(ci, li)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Xoá liên kết">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addColLink(ci)} className="text-xs text-gold inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Thêm liên kết</button>
              </div>
            </div>
          ))}
          <button onClick={addCol} className="text-xs text-gold inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Thêm cột</button>
        </div>
      </Panel>

      <Panel title="Mạng xã hội (Footer)">
        <div className="grid md:grid-cols-2 gap-3">
          {(["instagram", "facebook", "youtube", "tiktok"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{k}</label>
              <input className={inputCls} placeholder="https://…" value={s.socials?.[k] ?? ""}
                onChange={(e) => update({ socials: { ...(s.socials ?? {}), [k]: e.target.value } })} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Để trống thì ẩn biểu tượng tương ứng.</p>
      </Panel>

      <Panel title="Chân trang">
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Dòng bản quyền</label>
            <input className={inputCls} value={s.copyright ?? ""} onChange={(e) => update({ copyright: e.target.value })} />
            <p className="text-[11px] text-muted-foreground mt-1">Dùng <code>{"{year}"}</code> để chèn năm hiện tại.</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Liên kết phụ (cạnh bản quyền)</label>
            {(s.bottom_links ?? []).map((l: any, i: number) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input className={inputCls + " flex-1"} placeholder="Nhãn" value={l.label} onChange={(e) => updateBottom(i, { label: e.target.value })} />
                <input className={inputCls + " flex-[2]"} placeholder="/đường-dẫn hoặc https://…" value={l.to} onChange={(e) => updateBottom(i, { to: e.target.value })} />
                <button onClick={() => removeBottom(i)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Xoá">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={addBottom} className="text-xs text-gold inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Thêm liên kết</button>
          </div>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button onClick={save} className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium inline-flex items-center gap-2 hover:shadow-gold">
          <Save className="h-4 w-4" /> Lưu Header & Footer
        </button>
      </div>
    </div>
  );
}

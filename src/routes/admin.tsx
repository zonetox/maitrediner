import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Shield, Users, Store, CreditCard, CheckCircle2, XCircle, Star, Eye, EyeOff, ArrowRight, Calendar, ShoppingBag, Settings as SettingsIcon, Save, Plus, Trash2, Utensils, MapPin } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Maître" }] }),
  component: AdminPage,
});

type Tab = "overview" | "restaurants" | "payments" | "users" | "bookings" | "orders" | "directory" | "settings";

function AdminPage() {
  const { user, loading, hasRole, roles } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ restaurants: 0, users: 0, pending: 0, bookings: 0, orders: 0 });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function loadAll() {
    const [r, p, pr, ur, b, o] = await Promise.all([
      supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
      supabase.from("membership_payments").select("*, restaurants(name, slug)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("bookings").select("*, restaurants(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("orders").select("*, restaurants(name)").order("created_at", { ascending: false }).limit(100),
    ]);
    setRestaurants(r.data ?? []);
    setPayments(p.data ?? []);
    setProfiles(pr.data ?? []);
    setUserRoles(ur.data ?? []);
    setBookings(b.data ?? []);
    setOrders(o.data ?? []);
    setStats({
      restaurants: r.data?.length ?? 0,
      users: pr.data?.length ?? 0,
      pending: (p.data ?? []).filter((x: any) => x.status === "pending").length,
      bookings: b.data?.length ?? 0,
      orders: o.data?.length ?? 0,
    });
  }

  useEffect(() => {
    if (user && hasRole("admin")) loadAll();
  }, [user, roles.join(",")]);

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
        <SiteHeader />
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

  async function approvePayment(p: any) {
    const { error } = await supabase
      .from("membership_payments")
      .update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Đã duyệt thanh toán & kích hoạt gói");
    loadAll();
  }

  async function rejectPayment(p: any) {
    const { error } = await supabase
      .from("membership_payments")
      .update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Đã từ chối");
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-gold" />
          <h1 className="font-serif text-3xl">Bảng điều khiển Admin</h1>
        </div>
        <p className="text-muted-foreground mb-8">Quản trị toàn bộ hệ thống Maître</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Store className="h-5 w-5" />} label="Nhà hàng" value={stats.restaurants} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Người dùng" value={stats.users} />
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Chờ duyệt" value={stats.pending} highlight />
          <StatCard icon={<Calendar className="h-5 w-5" />} label="Đặt chỗ" value={stats.bookings} />
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6 flex gap-6 overflow-x-auto">
          {(["overview", "restaurants", "payments", "users", "bookings", "orders", "directory", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm whitespace-nowrap border-b-2 transition ${
                tab === t ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {labelOf(t)}
              {t === "payments" && stats.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gold text-primary-foreground">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="Thanh toán chờ duyệt">
              {payments.filter((p) => p.status === "pending").slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium">{p.restaurants?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.plan_name} · {Number(p.amount).toLocaleString("vi-VN")} đ</div>
                  </div>
                  <button onClick={() => setTab("payments")} className="text-xs text-gold inline-flex items-center gap-1">Xem <ArrowRight className="h-3 w-3" /></button>
                </div>
              ))}
              {payments.filter((p) => p.status === "pending").length === 0 && (
                <p className="text-sm text-muted-foreground">Không có thanh toán chờ duyệt.</p>
              )}
            </Panel>
            <Panel title="Nhà hàng mới">
              {restaurants.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.cuisine_type ?? "—"} · {r.city ?? "—"}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badgeFor(r.membership_status)}`}>{r.membership_status}</span>
                </div>
              ))}
            </Panel>
          </div>
        )}

        {tab === "restaurants" && (
          <Table head={["Tên", "Loại", "TP", "Gói", "Hết hạn", "Hiển thị", "Nổi bật", ""]}>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b border-border">
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
          </Table>
        )}

        {tab === "payments" && (
          <Table head={["Nhà hàng", "Gói", "Số tiền", "Ngày", "Chứng từ", "Trạng thái", "Hành động"]}>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border align-top">
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
            {payments.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chưa có thanh toán nào.</td></tr>
            )}
          </Table>
        )}

        {tab === "users" && (
          <Table head={["Tên", "Số ĐT", "Vai trò", "Ngày tạo", "Quyền"]}>
            {profiles.map((u) => {
              const userR = userRoles.filter((x) => x.user_id === u.id).map((x) => x.role);
              return (
                <tr key={u.id} className="border-b border-border">
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
          </Table>
        )}

        {tab === "bookings" && (
          <Table head={["Nhà hàng", "Khách", "SĐT", "Số người", "Thời gian", "Trạng thái"]}>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-border">
                <td className="py-3 font-medium">{b.restaurants?.name ?? "—"}</td>
                <td className="text-sm">{b.guest_name}</td>
                <td className="text-sm text-muted-foreground">{b.guest_phone}</td>
                <td className="text-sm">{b.party_size}</td>
                <td className="text-xs text-muted-foreground">{fmtDate(b.booking_at)}</td>
                <td><span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{b.status}</span></td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "orders" && (
          <Table head={["Nhà hàng", "Khách", "SĐT", "Số món", "Tổng", "Ngày", "Trạng thái"]}>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border align-top">
                <td className="py-3 font-medium">{o.restaurants?.name ?? "—"}</td>
                <td className="text-sm">{o.guest_name ?? "—"}</td>
                <td className="text-sm text-muted-foreground">{o.guest_phone ?? "—"}</td>
                <td className="text-sm">{Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.qty || 0), 0) : 0}</td>
                <td className="text-sm text-gold">{Number(o.total_amount).toLocaleString("vi-VN")}₫</td>
                <td className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</td>
                <td><span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border inline-flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{o.status}</span></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chưa có đơn món nào.</td></tr>
            )}
          </Table>
        )}

        {tab === "directory" && <DirectoryTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: any) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">{icon}{label}</div>
      <div className="font-serif text-3xl">{value}</div>
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-serif text-lg mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Table({ head, children }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground uppercase tracking-wider">
          <tr className="border-b border-border">
            {head.map((h: string) => <th key={h} className="text-left font-medium px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_td]:px-4">{children}</tbody>
      </table>
    </div>
  );
}

function labelOf(t: Tab) {
  return { overview: "Tổng quan", restaurants: "Nhà hàng", payments: "Thanh toán gói", users: "Người dùng", bookings: "Đặt chỗ", orders: "Đơn món", directory: "Danh mục & Địa điểm", settings: "Cấu hình" }[t];
}

function SettingsTab() {
  const [app, setApp] = useState<any>({ resend_api_key: "", resend_from: "Maître <onboarding@resend.dev>" });
  const [pay, setPay] = useState<any>({ qr_image_url: "", bank_name: "", account_no: "", account_holder: "", instructions: "" });
  const [showKey, setShowKey] = useState(false);
  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("app_settings").select("*").eq("id", true).maybeSingle(),
        supabase.from("payment_settings").select("*").eq("id", true).maybeSingle(),
      ]);
      if (a) setApp(a); if (p) setPay(p);
    })();
  }, []);
  async function saveApp() {
    const { error } = await supabase.from("app_settings").update({
      resend_api_key: app.resend_api_key, resend_from: app.resend_from, updated_at: new Date().toISOString(),
    }).eq("id", true);
    if (error) return toast.error(error.message);
    toast.success("Đã lưu cấu hình email");
  }
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
      <Panel title="Resend Email API">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">API Key (re_...)</label>
            <div className="flex gap-2 mt-1">
              <input type={showKey ? "text" : "password"} value={app.resend_api_key ?? ""}
                onChange={(e) => setApp({ ...app, resend_api_key: e.target.value })}
                placeholder="re_xxxxxxxxxxxxx"
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 font-mono text-xs" />
              <button onClick={() => setShowKey((v) => !v)} className="px-3 rounded-md border border-border text-xs">{showKey ? "Ẩn" : "Hiện"}</button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lấy tại resend.com/api-keys. Để trống = tắt email thông báo.</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">From</label>
            <input value={app.resend_from ?? ""} onChange={(e) => setApp({ ...app, resend_from: e.target.value })}
              className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2" />
          </div>
          <button onClick={saveApp} className="px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2">
            <Save className="h-3 w-3" /> Lưu
          </button>
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

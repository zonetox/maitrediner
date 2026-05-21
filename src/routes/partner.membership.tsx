import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Crown, Check, QrCode, Upload, Clock, AlertCircle } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/membership")({
  head: () => ({ meta: [{ title: "Nâng cấp gói — Maître" }] }),
  component: MembershipPage,
});

const PLANS = [
  {
    id: "monthly",
    name: "Essential",
    duration_days: 30,
    price: 499000,
    perks: ["Trang landing đầy đủ", "Nhận đặt chỗ không giới hạn", "Quản lý menu & ưu đãi", "Hỗ trợ email"],
  },
  {
    id: "quarterly",
    name: "Signature",
    duration_days: 90,
    price: 1290000,
    perks: ["Mọi tính năng Essential", "Ưu tiên hiển thị danh sách", "Huy hiệu Signature", "Hỗ trợ ưu tiên"],
    popular: true,
  },
  {
    id: "yearly",
    name: "Maître",
    duration_days: 365,
    price: 4490000,
    perks: ["Mọi tính năng Signature", "Hiển thị nhà hàng nổi bật trang chủ", "Báo cáo phân tích chi tiết", "Account manager riêng"],
  },
];

function MembershipPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [plan, setPlan] = useState(PLANS[1]);
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [pay, setPay] = useState<any>(null);
  useEffect(() => {
    supabase.from("payment_settings").select("*").eq("id", true).maybeSingle().then(({ data }) => setPay(data));
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("restaurants").select("*").eq("owner_id", user.id);
      setRestaurants(data ?? []);
      if (data?.[0]) setRestaurantId(data[0].id);
    })();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data } = await supabase.from("membership_payments").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false });
      setHistory(data ?? []);
    })();
  }, [restaurantId, submitting]);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId);

  async function submit() {
    if (!user || !restaurantId) return toast.error("Chọn nhà hàng");
    setSubmitting(true);
    const { error } = await supabase.from("membership_payments").insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      plan_name: plan.name,
      amount: plan.price,
      duration_days: plan.duration_days,
      proof_image_url: proofUrl || null,
      note: note || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Đã gửi yêu cầu. Admin sẽ duyệt trong 24 giờ.");
    setProofUrl(""); setNote("");
  }

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-6">
        <Link to="/partner" className="text-sm text-muted-foreground hover:text-gold">← Về quản trị</Link>
        <div className="flex items-center gap-3 mt-3 mb-2">
          <Crown className="h-6 w-6 text-gold" />
          <h1 className="font-serif text-3xl">Nâng cấp gói thành viên</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Thanh toán thủ công qua QR ngân hàng. Admin xác minh và kích hoạt trong vòng 24 giờ.
        </p>

        {restaurants.length > 1 && (
          <div className="mb-6">
            <label className="text-sm text-muted-foreground">Chọn nhà hàng</label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="mt-1 w-full md:w-80 bg-card border border-border rounded-md px-3 py-2"
            >
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}

        {selectedRestaurant && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Trạng thái hiện tại</div>
              <div className="font-medium mt-1">{selectedRestaurant.name}</div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-3 py-1 rounded-full ${badgeFor(selectedRestaurant.membership_status)}`}>
                {labelStatus(selectedRestaurant.membership_status)}
              </span>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedRestaurant.membership_status === "trial"
                  ? `Hết dùng thử: ${fmt(selectedRestaurant.trial_ends_at)}`
                  : selectedRestaurant.membership_ends_at
                    ? `Hết hạn: ${fmt(selectedRestaurant.membership_ends_at)}`
                    : ""}
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p)}
              className={`text-left rounded-2xl border p-6 transition relative ${
                plan.id === p.id ? "border-gold bg-gold/5 shadow-gold" : "border-border bg-card hover:border-gold/40"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2 right-4 text-xs px-3 py-0.5 rounded-full bg-gradient-gold text-primary-foreground">
                  Phổ biến
                </span>
              )}
              <div className="font-serif text-xl">{p.name}</div>
              <div className="mt-3 mb-4">
                <span className="font-serif text-3xl text-gold">{(p.price / 1000).toFixed(0)}K</span>
                <span className="text-muted-foreground text-sm"> / {p.duration_days} ngày</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-2"><Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />{perk}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Payment */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2"><QrCode className="h-5 w-5 text-gold" /> Quét QR thanh toán</h3>
            <div className="bg-white p-6 rounded-xl flex items-center justify-center mb-4 min-h-[220px]">
              {pay?.qr_image_url ? (
                <img src={pay.qr_image_url} alt="QR thanh toán" className="max-w-full max-h-72 object-contain" />
              ) : (
                <p className="text-sm text-gray-500 text-center">Admin chưa cấu hình QR. Vui lòng liên hệ để được hỗ trợ.</p>
              )}
            </div>
            <div className="text-sm space-y-1.5">
              {pay?.bank_name && <Row label="Ngân hàng" value={pay.bank_name} />}
              {pay?.account_no && <Row label="Số tài khoản" value={pay.account_no} />}
              {pay?.account_holder && <Row label="Chủ tài khoản" value={pay.account_holder} />}
              <Row label="Số tiền" value={`${plan.price.toLocaleString("vi-VN")} đ`} highlight />
              <Row label="Nội dung" value={`MAITRE ${selectedRestaurant?.slug ?? ""} ${plan.name}`} />
              {pay?.instructions && <p className="text-xs text-muted-foreground mt-3 whitespace-pre-line">{pay.instructions}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2"><Upload className="h-5 w-5 text-gold" /> Gửi xác nhận</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-muted-foreground">Ảnh chứng từ chuyển khoản</label>
                <div className="mt-2">
                  <ImageUploader
                    bucket="restaurant-images"
                    folder={`payments/${restaurantId || "unknown"}`}
                    value={proofUrl || null}
                    onChange={(url) => setProofUrl(url ?? "")}
                    aspect="aspect-video"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tải lên ảnh chụp giao dịch ngân hàng (tối đa 5MB).</p>
              </div>
              <div>
                <label className="text-muted-foreground">Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2"
                  placeholder="Mã giao dịch, thông tin liên hệ…"
                />
              </div>
              <button
                onClick={submit}
                disabled={submitting || !restaurantId}
                className="w-full px-5 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition disabled:opacity-50"
              >
                {submitting ? "Đang gửi…" : `Gửi yêu cầu duyệt (${plan.name})`}
              </button>
              <div className="text-xs text-muted-foreground flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> Gói sẽ được kích hoạt sau khi admin duyệt thanh toán.</div>
            </div>
          </div>
        </div>

        {/* History */}
        <h3 className="font-serif text-xl mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-gold" /> Lịch sử thanh toán</h3>
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium">Ngày</th>
                <th className="text-left px-4 py-3 font-medium">Gói</th>
                <th className="text-left px-4 py-3 font-medium">Số tiền</th>
                <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{fmt(h.created_at)}</td>
                  <td className="px-4 py-3">{h.plan_name} · {h.duration_days}d</td>
                  <td className="px-4 py-3">{Number(h.amount).toLocaleString("vi-VN")} đ</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${payBadge(h.status)}`}>{h.status}</span></td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Chưa có giao dịch.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}
function fmt(d: string | null) { return d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"; }
function labelStatus(s: string) { return ({ trial: "Đang dùng thử", active: "Đang hoạt động", expired: "Đã hết hạn", pending: "Chờ kích hoạt" } as any)[s] ?? s; }
function badgeFor(s: string) {
  return ({
    trial: "bg-gold/15 text-gold border border-gold/30",
    active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    expired: "bg-destructive/15 text-destructive border border-destructive/30",
    pending: "bg-muted text-muted-foreground border border-border",
  } as any)[s] ?? "bg-card";
}
function payBadge(s: string) {
  return ({
    pending: "bg-gold/15 text-gold border border-gold/30",
    approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    rejected: "bg-destructive/15 text-destructive border border-destructive/30",
  } as any)[s] ?? "bg-card";
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Shared helpers ----------

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[resend]", res.status, t);
    return { ok: false, error: t };
  }
  return { ok: true };
}

function wrap(title: string, body: string) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#0b0b0b;color:#eee;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;padding:28px">
    <h2 style="color:#d4af37;font-family:Georgia,serif;margin:0 0 12px">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0"/>
    <p style="font-size:12px;color:#888;margin:0">Maison Dining — Danh bạ nhà hàng cao cấp</p>
  </div></body></html>`;
}

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function isOwnerOf(userId: string, restaurantId: string) {
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("owner_id")
    .eq("id", restaurantId)
    .maybeSingle();
  return data?.owner_id === userId;
}

// ---------- Authenticated notify (status updates + payment review) ----------

const AuthedSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("booking_status"),
    restaurantId: z.string().uuid(),
    recordId: z.string().uuid(),
    newStatus: z.string().min(1).max(32),
  }),
  z.object({
    type: z.literal("order_status"),
    restaurantId: z.string().uuid(),
    recordId: z.string().uuid(),
    newStatus: z.string().min(1).max(32),
  }),
  z.object({
    type: z.literal("payment_approved"),
    paymentId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("payment_rejected"),
    paymentId: z.string().uuid(),
  }),
]);

export const notify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AuthedSchema.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Maison Dining <onboarding@resend.dev>";
    if (!apiKey) return { ok: false, skipped: "no_api_key" };
    const { userId } = context;
    const sent: string[] = [];

    // Payment review — admin only
    if (data.type === "payment_approved" || data.type === "payment_rejected") {
      if (!(await isAdmin(userId))) {
        throw new Response("Forbidden", { status: 403 });
      }
      const { data: pay } = await supabaseAdmin
        .from("membership_payments")
        .select("*, restaurants(name, slug, email, owner_id)")
        .eq("id", data.paymentId)
        .maybeSingle();
      if (!pay) return { ok: false, skipped: "no_payment" };
      const rest = (pay as any).restaurants;
      const approved = data.type === "payment_approved";
      const amount = Number(pay.amount).toLocaleString("vi-VN");
      const days = pay.duration_days;
      const html = wrap(
        approved ? `Thanh toán đã được duyệt — ${rest?.name ?? ""}` : `Thanh toán bị từ chối — ${rest?.name ?? ""}`,
        approved
          ? `<p>Xin chào,</p>
             <p>Thanh toán gói <b>${escapeHtml(pay.plan_name)}</b> trị giá <b>${amount}₫</b> đã được duyệt. Nhà hàng <b>${escapeHtml(rest?.name ?? "")}</b> đã được kích hoạt thêm <b>${days} ngày</b>.</p>
             <p>${pay.note ? `Ghi chú admin: ${escapeHtml(pay.note)}` : ""}</p>`
          : `<p>Xin chào,</p>
             <p>Yêu cầu thanh toán gói <b>${escapeHtml(pay.plan_name)}</b> trị giá <b>${amount}₫</b> đã bị từ chối.</p>
             ${pay.note ? `<p>Lý do/Ghi chú: ${escapeHtml(pay.note)}</p>` : ""}
             <p>Vui lòng kiểm tra lại thông tin và gửi lại biên lai nếu cần.</p>`
      );
      if (rest?.email) { await sendEmail(apiKey, from, rest.email, approved ? `[Maison Dining] Gói đã kích hoạt` : `[Maison Dining] Thanh toán bị từ chối`, html); sent.push("restaurant"); }
      if (pay.user_id) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(pay.user_id);
        const em = u?.user?.email;
        if (em && em !== rest?.email) { await sendEmail(apiKey, from, em, approved ? `Gói thành viên đã kích hoạt` : `Thanh toán bị từ chối`, html); sent.push("user"); }
      }
      return { ok: true, sent };
    }

    // booking_status / order_status — admin OR owner of the restaurant
    if (!(await isAdmin(userId)) && !(await isOwnerOf(userId, data.restaurantId))) {
      throw new Response("Forbidden", { status: 403 });
    }
    const { data: r } = await supabaseAdmin.from("restaurants").select("name, email, slug").eq("id", data.restaurantId).maybeSingle();
    if (!r) return { ok: false, skipped: "no_restaurant" };

    const isBooking = data.type === "booking_status";
    const { data: rec } = await supabaseAdmin
      .from(isBooking ? "bookings" : "orders")
      .select("*")
      .eq("id", data.recordId)
      .eq("restaurant_id", data.restaurantId)
      .maybeSingle();
    if (!rec) return { ok: false, skipped: "no_record" };

    const label: Record<string, string> = {
      confirmed: "đã được xác nhận", cancelled: "đã bị hủy", completed: "đã hoàn tất",
      rejected: "đã bị từ chối", preparing: "đang chuẩn bị", ready: "đã sẵn sàng",
    };
    const verb = label[data.newStatus] || data.newStatus;
    const html = wrap(`Cập nhật ${isBooking ? "đặt chỗ" : "đơn món"} — ${r.name}`, `
      <p>Xin chào <b>${escapeHtml((rec as any).guest_name || "")}</b>,</p>
      <p>Yêu cầu của bạn tại <b>${escapeHtml(r.name)}</b> ${verb}.</p>`);
    let email: string | null = (rec as any).guest_email ?? null;
    if (!email && (rec as any).user_id) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById((rec as any).user_id);
      email = u?.user?.email ?? null;
    }
    if (email) { await sendEmail(apiKey, from, email, `Cập nhật yêu cầu — ${r.name}`, html); sent.push("guest"); }
    return { ok: true, sent };
  });

// ---------- Public notify for new booking/order ----------
// Anti-enumeration: only sends if the record was created in the last 120s.
// This window matches the latency between insert and the client follow-up call.

const PublicSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("booking"),
    restaurantId: z.string().uuid(),
    recordId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("order"),
    restaurantId: z.string().uuid(),
    recordId: z.string().uuid(),
  }),
]);

export const notifyNew = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PublicSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Maison Dining <onboarding@resend.dev>";
    if (!apiKey) return { ok: false, skipped: "no_api_key" };

    const { data: r } = await supabaseAdmin
      .from("restaurants")
      .select("name, email, slug")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (!r) return { ok: false, skipped: "no_restaurant" };

    const sent: string[] = [];

    if (data.type === "booking") {
      const { data: b } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", data.recordId)
        .eq("restaurant_id", data.restaurantId)
        .maybeSingle();
      if (!b) return { ok: false, skipped: "no_record" };
      // Anti-enumeration: must be very recent
      const ageMs = Date.now() - new Date(b.created_at).getTime();
      if (ageMs > 120_000) return { ok: false, skipped: "stale_record" };

      const when = new Date(b.booking_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });
      const guestHtml = wrap(`Đã nhận yêu cầu đặt chỗ tại ${r.name}`, `
        <p>Xin chào <b>${escapeHtml(b.guest_name)}</b>,</p>
        <p>Chúng tôi đã nhận yêu cầu đặt chỗ của bạn. Nhà hàng sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
        <p><b>Thời gian:</b> ${when}<br/><b>Số khách:</b> ${b.party_size}</p>`);
      const ownerHtml = wrap(`Yêu cầu đặt chỗ mới — ${r.name}`, `
        <p><b>Khách:</b> ${escapeHtml(b.guest_name)} (${escapeHtml(b.guest_phone)})</p>
        <p><b>Thời gian:</b> ${when} · <b>Số khách:</b> ${b.party_size}</p>
        ${b.notes ? `<p><b>Ghi chú:</b> ${escapeHtml(b.notes)}</p>` : ""}`);
      if (b.guest_email) { await sendEmail(apiKey, from, b.guest_email, `Đã nhận yêu cầu đặt chỗ — ${r.name}`, guestHtml); sent.push("guest"); }
      if (r.email) { await sendEmail(apiKey, from, r.email, `[Maison Dining] Đặt chỗ mới — ${b.guest_name}`, ownerHtml); sent.push("owner"); }
      return { ok: true, sent };
    }

    // order
    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.recordId)
      .eq("restaurant_id", data.restaurantId)
      .maybeSingle();
    if (!o) return { ok: false, skipped: "no_record" };
    const ageMs = Date.now() - new Date(o.created_at).getTime();
    if (ageMs > 120_000) return { ok: false, skipped: "stale_record" };

    const items = (o.items as any[]) || [];
    const list = items.map((i) => `<li>${escapeHtml(i.name)} × ${i.qty} — ${Number(i.price * i.qty).toLocaleString("vi-VN")}₫</li>`).join("");
    const total = Number(o.total_amount).toLocaleString("vi-VN");
    const guestHtml = wrap(`Đã nhận yêu cầu đặt món tại ${r.name}`, `
      <p>Xin chào <b>${escapeHtml(o.guest_name || "")}</b>,</p>
      <ul>${list}</ul><p><b>Tổng:</b> ${total}₫</p>
      <p>Nhà hàng sẽ liên hệ xác nhận. <i>Đây không phải hóa đơn thanh toán.</i></p>`);
    const ownerHtml = wrap(`Đơn món mới — ${r.name}`, `
      <p><b>Khách:</b> ${escapeHtml(o.guest_name || "")} (${escapeHtml(o.guest_phone || "")})</p>
      <ul>${list}</ul><p><b>Tổng:</b> ${total}₫</p>
      ${o.notes ? `<p><b>Ghi chú:</b> ${escapeHtml(o.notes)}</p>` : ""}`);
    if (o.user_id) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(o.user_id);
      const em = u?.user?.email;
      if (em) { await sendEmail(apiKey, from, em, `Đã nhận yêu cầu đặt món — ${r.name}`, guestHtml); sent.push("guest"); }
    }
    if (r.email) { await sendEmail(apiKey, from, r.email, `[Maison Dining] Đơn món mới`, ownerHtml); sent.push("owner"); }
    return { ok: true, sent };
  });

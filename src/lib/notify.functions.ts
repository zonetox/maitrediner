import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Payload = {
  type: "booking" | "order" | "booking_status" | "order_status" | "payment_approved" | "payment_rejected";
  restaurantId?: string;
  recordId?: string;
  // For status updates (partner side)
  newStatus?: string;
  // For payment_approved / payment_rejected — paymentId points to membership_payments.id
  paymentId?: string;
};

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

export const notify = createServerFn({ method: "POST" })
  .inputValidator((d: Payload) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Maison Dining <onboarding@resend.dev>";
    if (!apiKey) return { ok: false, skipped: "no_api_key" };

    const sent: string[] = [];

    // Payment approval / rejection — fetch payment + restaurant + owner email separately
    if ((data.type === "payment_approved" || data.type === "payment_rejected") && data.paymentId) {
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
      // Send to restaurant contact email
      if (rest?.email) { await sendEmail(apiKey, from, rest.email, approved ? `[Maison Dining] Gói đã kích hoạt` : `[Maison Dining] Thanh toán bị từ chối`, html); sent.push("restaurant"); }
      // Also send to the user who submitted (owner)
      if (pay.user_id) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(pay.user_id);
        const em = u?.user?.email;
        if (em && em !== rest?.email) { await sendEmail(apiKey, from, em, approved ? `Gói thành viên đã kích hoạt` : `Thanh toán bị từ chối`, html); sent.push("user"); }
      }
      return { ok: true, sent };
    }

    if (!data.restaurantId) return { ok: false, skipped: "no_restaurant_id" };
    const { data: r } = await supabaseAdmin.from("restaurants").select("name, email, slug").eq("id", data.restaurantId).maybeSingle();
    if (!r) return { ok: false, skipped: "no_restaurant" };


    if (data.type === "booking" && data.recordId) {
      const { data: b } = await supabaseAdmin.from("bookings").select("*").eq("id", data.recordId).maybeSingle();
      if (!b) return { ok: false, skipped: "no_record" };
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
    }

    if (data.type === "order" && data.recordId) {
      const { data: o } = await supabaseAdmin.from("orders").select("*").eq("id", data.recordId).maybeSingle();
      if (!o) return { ok: false, skipped: "no_record" };
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
      // Orders table has no guest_email column; use customer profile email if user_id exists
      if (o.user_id) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(o.user_id);
        const em = u?.user?.email;
        if (em) { await sendEmail(apiKey, from, em, `Đã nhận yêu cầu đặt món — ${r.name}`, guestHtml); sent.push("guest"); }
      }
      if (r.email) { await sendEmail(apiKey, from, r.email, `[Maison Dining] Đơn món mới`, ownerHtml); sent.push("owner"); }
    }

    if ((data.type === "booking_status" || data.type === "order_status") && data.recordId && data.newStatus) {
      const isBooking = data.type === "booking_status";
      const { data: rec } = await supabaseAdmin.from(isBooking ? "bookings" : "orders").select("*").eq("id", data.recordId).maybeSingle();
      if (!rec) return { ok: false, skipped: "no_record" };
      const label: Record<string, string> = {
        confirmed: "đã được xác nhận", cancelled: "đã bị hủy", completed: "đã hoàn tất",
        rejected: "đã bị từ chối", preparing: "đang chuẩn bị", ready: "đã sẵn sàng",
      };
      const verb = label[data.newStatus] || data.newStatus;
      const html = wrap(`Cập nhật ${isBooking ? "đặt chỗ" : "đơn món"} — ${r.name}`, `
        <p>Xin chào <b>${escapeHtml(rec.guest_name || "")}</b>,</p>
        <p>Yêu cầu của bạn tại <b>${escapeHtml(r.name)}</b> ${verb}.</p>`);
      let email: string | null = (rec as any).guest_email ?? null;
      if (!email && rec.user_id) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(rec.user_id);
        email = u?.user?.email ?? null;
      }
      if (email) { await sendEmail(apiKey, from, email, `Cập nhật yêu cầu — ${r.name}`, html); sent.push("guest"); }
    }

    return { ok: true, sent };
  });

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

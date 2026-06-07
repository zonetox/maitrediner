import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers ----------
async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `r-${Date.now().toString(36)}`;
}

async function uniqueSlug(base: string) {
  let slug = base;
  let i = 1;
  while (true) {
    const { data } = await supabaseAdmin.from("restaurants").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

// ---------- Firecrawl scrape ----------

const ScrapeInput = z.object({ url: z.string().url() });

const ExtractSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Tên nhà hàng" },
    cuisine_type: { type: "string", description: "Loại ẩm thực, vd: Ý, Nhật, Hải sản" },
    city: { type: "string", description: "Thành phố" },
    address: { type: "string", description: "Địa chỉ đầy đủ" },
    phone: { type: "string", description: "Số điện thoại" },
    email: { type: "string", description: "Email liên hệ" },
    short_description: { type: "string", description: "Mô tả ngắn 1-2 câu" },
    cover_image_url: { type: "string", description: "URL ảnh bìa/hero chính (https)" },
    price_range: { type: "string", description: "Mức giá: ₫, ₫₫, ₫₫₫, hoặc ₫₫₫₫" },
    hours: { type: "string", description: "Giờ mở cửa" },
    story: { type: "string", description: "Câu chuyện thương hiệu / giới thiệu dài" },
  },
};

export const scrapeRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScrapeInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Response("Forbidden", { status: 403 });
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Response("FIRECRAWL_API_KEY chưa cấu hình", { status: 500 });

    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: data.url,
        onlyMainContent: true,
        formats: [
          "markdown",
          { type: "json", schema: ExtractSchema, prompt: "Trích thông tin nhà hàng từ trang này. Bỏ qua nếu không có." },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Response(`Firecrawl ${res.status}: ${t.slice(0, 300)}`, { status: 502 });
    }
    const json: any = await res.json();
    const doc = json?.data ?? json;
    const extracted = doc?.json ?? doc?.extract ?? {};
    const metadata = doc?.metadata ?? {};
    return {
      draft: {
        name: extracted.name || metadata.title || "",
        cuisine_type: extracted.cuisine_type || "",
        city: extracted.city || "",
        address: extracted.address || "",
        phone: extracted.phone || "",
        email: extracted.email || "",
        short_description: extracted.short_description || metadata.description || "",
        cover_image_url: extracted.cover_image_url || metadata.ogImage || "",
        price_range: extracted.price_range || "₫₫₫",
        hours: extracted.hours || "",
        story: extracted.story || "",
      },
      source_url: data.url,
      markdown: doc?.markdown ? String(doc.markdown).slice(0, 4000) : "",
    };
  });

// ---------- Save draft / bulk import ----------

const DraftRow = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(80).optional(),
  cuisine_type: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  short_description: z.string().max(2000).optional().nullable(),
  cover_image_url: z.string().max(1000).optional().nullable(),
  price_range: z.string().max(20).optional().nullable(),
  hours: z.string().max(500).optional().nullable(),
  story: z.string().max(8000).optional().nullable(),
  source_url: z.string().url().optional().nullable(),
});

const ImportInput = z.object({ rows: z.array(DraftRow).min(1).max(200) });

export const importRestaurants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Response("Forbidden", { status: 403 });
    const results: { name: string; status: "ok" | "error"; id?: string; slug?: string; error?: string }[] = [];

    for (const row of data.rows) {
      const baseSlug = slugify(row.slug || row.name);
      try {
        const slug = await uniqueSlug(baseSlug);
        const landing_content: any = {
          hero_tagline: row.short_description || "Trải nghiệm ẩm thực đáng nhớ",
          story: row.story || "",
          hours: row.hours || "",
        };
        const { data: inserted, error } = await supabaseAdmin
          .from("restaurants")
          .insert({
            owner_id: context.userId,
            name: row.name,
            slug,
            cuisine_type: row.cuisine_type || null,
            city: row.city || null,
            address: row.address || null,
            phone: row.phone || null,
            email: row.email || null,
            short_description: row.short_description || null,
            cover_image_url: row.cover_image_url || null,
            price_range: row.price_range || "₫₫₫",
            is_published: false,
            landing_content,
            source_url: row.source_url || null,
            imported_at: new Date().toISOString(),
          })
          .select("id, slug")
          .single();
        if (error) throw error;
        results.push({ name: row.name, status: "ok", id: inserted!.id, slug: inserted!.slug });
      } catch (e: any) {
        results.push({ name: row.name, status: "error", error: e?.message ?? String(e) });
      }
    }

    return {
      created: results.filter((r) => r.status === "ok").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    };
  });

// ---------- Enrich existing draft via Firecrawl ----------

const EnrichInput = z.object({
  restaurant_id: z.string().uuid(),
  url: z.string().url().optional(),
  overwrite: z.boolean().default(false),
});

export const enrichRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EnrichInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Response("Forbidden", { status: 403 });
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Response("FIRECRAWL_API_KEY chưa cấu hình", { status: 500 });

    const { data: existing, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("id", data.restaurant_id)
      .maybeSingle();
    if (rErr || !existing) throw new Response("Không tìm thấy nhà hàng", { status: 404 });

    const url = data.url || existing.source_url;
    if (!url) throw new Response("Thiếu source_url (URL gốc)", { status: 400 });

    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        onlyMainContent: true,
        formats: [
          "markdown",
          { type: "json", schema: ExtractSchema, prompt: "Trích thông tin nhà hàng từ trang này. Bỏ qua nếu không có." },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Response(`Firecrawl ${res.status}: ${t.slice(0, 300)}`, { status: 502 });
    }
    const json: any = await res.json();
    const doc = json?.data ?? json;
    const ex = doc?.json ?? doc?.extract ?? {};
    const meta = doc?.metadata ?? {};

    // Only fill empty fields unless overwrite=true
    const pick = (current: any, next: any) =>
      data.overwrite ? (next || current) : (current && String(current).trim() ? current : next || current);

    const update: Record<string, any> = {
      name: pick(existing.name, ex.name || meta.title),
      cuisine_type: pick(existing.cuisine_type, ex.cuisine_type),
      city: pick(existing.city, ex.city),
      address: pick(existing.address, ex.address),
      phone: pick(existing.phone, ex.phone),
      email: pick(existing.email, ex.email),
      short_description: pick(existing.short_description, ex.short_description || meta.description),
      cover_image_url: pick(existing.cover_image_url, ex.cover_image_url || meta.ogImage),
      price_range: pick(existing.price_range, ex.price_range),
      source_url: url,
      imported_at: new Date().toISOString(),
    };

    const lc = (existing.landing_content || {}) as any;
    update.landing_content = {
      ...lc,
      hero_tagline: pick(lc.hero_tagline, ex.short_description || meta.description),
      story: pick(lc.story, ex.story),
      hours: pick(lc.hours, ex.hours),
    };

    const filled: string[] = [];
    for (const [k, v] of Object.entries(update)) {
      if (k === "imported_at" || k === "source_url" || k === "landing_content") continue;
      if (v && v !== (existing as any)[k]) filled.push(k);
    }

    const { error: uErr } = await supabaseAdmin
      .from("restaurants")
      .update(update as any)
      .eq("id", data.restaurant_id);
    if (uErr) throw new Response(uErr.message, { status: 500 });

    return { ok: true, filled, name: update.name };
  });

// ---------- List drafts that can be enriched ----------

export const listImportedDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Response("Forbidden", { status: 403 });
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("id, name, slug, city, cuisine_type, cover_image_url, short_description, source_url, is_published, imported_at")
      .not("source_url", "is", null)
      .order("imported_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw new Response(error.message, { status: 500 });
    return { rows: data ?? [] };
  });

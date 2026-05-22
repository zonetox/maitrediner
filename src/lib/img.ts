// Image helper. If the URL is a Supabase storage public object,
// rewrite to the on-the-fly image transform endpoint (WebP + resize).
// Falls back to the original URL otherwise.
export function img(
  url: string | null | undefined,
  opts: { w?: number; h?: number; q?: number; resize?: "cover" | "contain" | "fill" } = {},
): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const marker = "/storage/v1/object/public/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return url;
    const rest = u.pathname.slice(i + marker.length);
    const params = new URLSearchParams();
    if (opts.w) params.set("width", String(opts.w));
    if (opts.h) params.set("height", String(opts.h));
    params.set("quality", String(opts.q ?? 75));
    params.set("resize", opts.resize ?? "cover");
    params.set("format", "webp");
    return `${u.origin}/storage/v1/render/image/public/${rest}?${params.toString()}`;
  } catch {
    return url;
  }
}

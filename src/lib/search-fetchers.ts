import { supabase } from "@/integrations/supabase/client";
import type { Suggestion } from "@/components/LiveSearch";

export async function searchRestaurants(q: string): Promise<Suggestion[]> {
  const needle = q.trim();
  if (!needle) return [];
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, city, cuisine_type, cover_image_url, is_published")
    .eq("is_published", true)
    .ilike("name", `%${needle}%`)
    .limit(6);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.name,
    subtitle: [r.cuisine_type, r.city].filter(Boolean).join(" · "),
    image: r.cover_image_url,
    to: `/r/${r.slug}`,
    badge: r.cuisine_type ? undefined : undefined,
  }));
}

export async function searchSignatureDishes(q: string): Promise<Suggestion[]> {
  const needle = q.trim();
  if (!needle) return [];
  const { data } = await supabase
    .from("menu_items")
    .select("id, name, image_url, image_urls, restaurants:restaurant_id (name, slug, city, is_published)")
    .eq("is_signature", true)
    .eq("is_available", true)
    .ilike("name", `%${needle}%`)
    .limit(6);
  return (data ?? [])
    .filter((d: any) => d.restaurants?.is_published)
    .map((d: any) => ({
      id: d.id,
      title: d.name,
      subtitle: [d.restaurants?.name, d.restaurants?.city].filter(Boolean).join(" · "),
      image: d.image_url || d.image_urls?.[0] || null,
      to: `/r/${d.restaurants?.slug ?? ""}`,
      badge: "Signature",
    }));
}

export async function searchBlogPosts(q: string): Promise<Suggestion[]> {
  const needle = q.trim();
  if (!needle) return [];
  const { data } = await (supabase as any)
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, blog_categories(name)")
    .eq("status", "published")
    .ilike("title", `%${needle}%`)
    .limit(6);
  return (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    subtitle: p.blog_categories?.name || p.excerpt?.slice(0, 80) || undefined,
    image: p.cover_image_url,
    to: `/blog/${p.slug}`,
    badge: p.blog_categories?.name,
  }));
}

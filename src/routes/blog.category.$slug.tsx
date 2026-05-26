import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, Calendar, Clock, BookOpen } from "lucide-react";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: async ({ params }) => {
    const { data } = await (supabase as any).from("blog_categories")
      .select("*").eq("slug", params.slug).eq("is_active", true).maybeSingle();
    if (!data) throw notFound();
    return { category: data };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.category;
    const title = c ? `${c.name} — Blog Maison Dining` : "Danh mục blog — Maison Dining";
    return {
      meta: [
        { title }, { name: "description", content: c?.description || `Bài viết thuộc danh mục ${c?.name} trên Maison Dining.` },
        { property: "og:title", content: title },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-32 max-w-2xl mx-auto px-6 text-center">
        <h1 className="font-serif text-3xl mb-3">Không tìm thấy danh mục</h1>
        <Link to="/blog" className="text-gold hover:underline">← Về Blog</Link>
      </div>
    </div>
  ),
  component: BlogCategoryPage,
});

function BlogCategoryPage() {
  const { category } = Route.useLoaderData();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, published_at, reading_minutes")
        .eq("status", "published")
        .eq("category_id", category.id)
        .order("published_at", { ascending: false });
      setPosts(data ?? []); setLoading(false);
    })();
  }, [category.id]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-6">
        <Link to="/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-gold mb-6">
          <ArrowLeft className="h-3 w-3" /> Tất cả bài viết
        </Link>
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Danh mục</span>
          <h1 className="font-serif text-4xl md:text-6xl mt-3">{category.name}</h1>
          {category.description && <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{category.description}</p>}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-20">Đang tải…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-40" />
            Chưa có bài viết trong danh mục này.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p) => (
              <article key={p.id} className="group">
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 bg-secondary">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-gold/30"><BookOpen className="h-12 w-12" /></div>
                    )}
                  </div>
                  <h2 className="font-serif text-2xl group-hover:text-gold transition leading-snug">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                    {p.published_at && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                        {new Date(p.published_at).toLocaleDateString("vi-VN")}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.reading_minutes} phút</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

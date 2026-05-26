import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, Clock, BookOpen } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog ẩm thực — Maison Dining" },
      { name: "description", content: "Bài viết, hướng dẫn và câu chuyện về fine dining, omakase, steakhouse và văn hoá ẩm thực cao cấp tại Việt Nam." },
      { property: "og:title", content: "Blog ẩm thực — Maison Dining" },
      { property: "og:description", content: "Khám phá thế giới ẩm thực cao cấp qua góc nhìn của Maison Dining." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [posts, setPosts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        (supabase as any).from("blog_posts")
          .select("id, title, slug, excerpt, cover_image_url, published_at, reading_minutes, category_id, blog_categories(name, slug)")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        (supabase as any).from("blog_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setPosts(p ?? []); setCats(c ?? []); setLoading(false);
    })();
  }, []);

  const filtered = activeCat ? posts.filter((p) => p.category_id === activeCat) : posts;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Maison Journal</span>
          <h1 className="font-serif text-4xl md:text-6xl mt-3">Blog ẩm thực</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Câu chuyện, hướng dẫn và cảm hứng từ thế giới fine dining.
          </p>
        </div>

        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <button onClick={() => setActiveCat(null)}
              className={`text-xs px-4 py-2 rounded-full border ${!activeCat ? "border-gold text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>
              Tất cả
            </button>
            {cats.map((c) => (
              <Link key={c.id} to="/blog/category/$slug" params={{ slug: c.slug }}
                className="text-xs px-4 py-2 rounded-full border border-border text-muted-foreground hover:border-gold hover:text-gold">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-20">Đang tải…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-40" />
            Chưa có bài viết nào.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((p) => (
              <article key={p.id} className="group">
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 bg-secondary">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-gold/30">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  {p.blog_categories?.name && (
                    <div className="text-[10px] tracking-[0.2em] uppercase text-gold mb-2">{p.blog_categories.name}</div>
                  )}
                  <h2 className="font-serif text-2xl group-hover:text-gold transition leading-snug">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                    {p.published_at && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                        {new Date(p.published_at).toLocaleDateString("vi-VN")}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.reading_minutes} phút đọc</span>
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

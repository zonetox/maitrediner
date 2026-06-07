import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, Clock, BookOpen, Search, X, ArrowUpRight } from "lucide-react";
import { img } from "@/lib/img";
import { LiveSearch } from "@/components/LiveSearch";
import { searchBlogPosts } from "@/lib/search-fetchers";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog ẩm thực — Tạp chí Maison Dining" },
      { name: "description", content: "Tạp chí trực tuyến về fine dining, omakase, steakhouse, wine pairing và những câu chuyện hậu trường của bếp trưởng tài hoa tại Việt Nam." },
      { property: "og:title", content: "Tạp chí Maison Dining" },
      { property: "og:description", content: "Khám phá thế giới ẩm thực cao cấp qua góc nhìn biên tập của Maison Dining." },
    ],
  }),
  component: BlogIndex,
});

type Post = {
  id: string; title: string; slug: string; excerpt: string | null;
  cover_image_url: string | null; published_at: string | null;
  reading_minutes: number; category_id: string | null; tags: string[];
  blog_categories?: { name: string; slug: string } | null;
};
type Cat = { id: string; name: string; slug: string };

function BlogIndex() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        (supabase as any).from("blog_posts")
          .select("id, title, slug, excerpt, cover_image_url, published_at, reading_minutes, category_id, tags, blog_categories(name, slug)")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        (supabase as any).from("blog_categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
      ]);
      setPosts(p ?? []); setCats(c ?? []); setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeCat && p.category_id !== activeCat) return false;
      if (!qq) return true;
      const hay = `${p.title} ${p.excerpt ?? ""} ${(p.tags ?? []).join(" ")} ${p.blog_categories?.name ?? ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [posts, activeCat, q]);

  const featured = filtered[0];
  const secondary = filtered.slice(1, 3);
  const rest = filtered.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20">
        {/* Masthead */}
        <header className="max-w-6xl mx-auto px-6 text-center border-b border-border pb-10 mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold">Maison Journal · Số {new Date().getFullYear()}</div>
          <h1 className="font-serif text-5xl md:text-7xl mt-4 leading-[1.05]">Tạp chí ẩm thực</h1>
          <p className="text-muted-foreground mt-5 max-w-2xl mx-auto italic">
            Những câu chuyện, hướng dẫn và cảm hứng từ thế giới fine dining — biên tập bởi Maison Dining.
          </p>
        </header>

        <div className="max-w-6xl mx-auto px-6">
          {/* Search + categories */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="relative max-w-xl mx-auto w-full">
              <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm bài viết, tác giả, từ khoá…"
                className="w-full bg-card border border-border rounded-full pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-gold transition"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {cats.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => setActiveCat(null)}
                  className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 rounded-full border transition ${!activeCat ? "border-gold text-gold bg-gold/5" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                  Tất cả
                </button>
                {cats.map((c) => (
                  <button key={c.id} onClick={() => setActiveCat(c.id === activeCat ? null : c.id)}
                    className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 rounded-full border transition ${activeCat === c.id ? "border-gold text-gold bg-gold/5" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-20">Đang tải…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-40" />
              {q || activeCat ? "Không tìm thấy bài viết phù hợp." : "Chưa có bài viết nào."}
            </div>
          ) : (
            <>
              {/* Magazine hero: featured + 2 secondary */}
              {featured && (
                <section className="grid lg:grid-cols-[1.4fr_1fr] gap-8 mb-16">
                  <FeaturedCard p={featured} />
                  <div className="flex flex-col gap-6">
                    {secondary.map((p) => <SecondaryCard key={p.id} p={p} />)}
                  </div>
                </section>
              )}

              {/* Section divider */}
              {rest.length > 0 && (
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] tracking-[0.4em] uppercase text-gold">Đọc tiếp</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Grid rest */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {rest.map((p) => <GridCard key={p.id} p={p} />)}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function meta(p: Post) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      {p.published_at && (
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
          {new Date(p.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}</span>
      )}
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.reading_minutes} phút</span>
    </div>
  );
}

function FeaturedCard({ p }: { p: Post }) {
  return (
    <Link to="/blog/$slug" params={{ slug: p.slug }} className="group block">
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] lg:aspect-[5/4] bg-secondary">
        {p.cover_image_url ? (
          <img src={img(p.cover_image_url, { w: 1400 })} alt={p.title} loading="eager"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms]" />
        ) : <div className="absolute inset-0 grid place-items-center text-gold/30"><BookOpen className="h-16 w-16" /></div>}
        <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase px-3 py-1.5 rounded-full bg-background/80 backdrop-blur text-gold border border-gold/30">
          Bài đọc nổi bật
        </div>
      </div>
      <div className="mt-6">
        {p.blog_categories?.name && (
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">{p.blog_categories.name}</div>
        )}
        <h2 className="font-serif text-3xl md:text-4xl leading-tight group-hover:text-gold transition">{p.title}</h2>
        {p.excerpt && <p className="text-muted-foreground mt-3 leading-relaxed line-clamp-3">{p.excerpt}</p>}
        <div className="flex items-center justify-between mt-4">
          {meta(p)}
          <span className="text-xs text-gold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Đọc bài <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SecondaryCard({ p }: { p: Post }) {
  return (
    <Link to="/blog/$slug" params={{ slug: p.slug }} className="group grid grid-cols-[140px_1fr] gap-4 items-start">
      <div className="relative overflow-hidden rounded-xl aspect-square bg-secondary">
        {p.cover_image_url ? (
          <img src={img(p.cover_image_url, { w: 400, h: 400 })} alt={p.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : <div className="absolute inset-0 grid place-items-center text-gold/30"><BookOpen className="h-8 w-8" /></div>}
      </div>
      <div>
        {p.blog_categories?.name && (
          <div className="text-[9px] tracking-[0.3em] uppercase text-gold mb-1.5">{p.blog_categories.name}</div>
        )}
        <h3 className="font-serif text-xl leading-snug group-hover:text-gold transition line-clamp-3">{p.title}</h3>
        <div className="mt-2">{meta(p)}</div>
      </div>
    </Link>
  );
}

function GridCard({ p }: { p: Post }) {
  return (
    <article className="group">
      <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-5 bg-secondary">
          {p.cover_image_url ? (
            <img src={img(p.cover_image_url, { w: 800 })} alt={p.title} loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : <div className="absolute inset-0 grid place-items-center text-gold/30"><BookOpen className="h-12 w-12" /></div>}
        </div>
        {p.blog_categories?.name && (
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-2">{p.blog_categories.name}</div>
        )}
        <h2 className="font-serif text-2xl leading-snug group-hover:text-gold transition">{p.title}</h2>
        {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{p.excerpt}</p>}
        <div className="mt-3">{meta(p)}</div>
      </Link>
    </article>
  );
}

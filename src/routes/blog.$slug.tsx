import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { img } from "@/lib/img";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data } = await (supabase as any).from("blog_posts")
      .select("*, blog_categories(name, slug)")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) throw notFound();
    const { data: related } = await (supabase as any).from("blog_posts")
      .select("id, title, slug, cover_image_url, published_at, reading_minutes, blog_categories(name, slug)")
      .eq("status", "published")
      .eq("category_id", data.category_id)
      .neq("id", data.id)
      .order("published_at", { ascending: false })
      .limit(3);
    return { post: data, related: related ?? [] };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.post;
    if (!p) return { meta: [{ title: "Bài viết — Maison Dining" }] };
    const title = (p.seo_title || p.title) + " — Maison Dining";
    const desc = p.seo_description || p.excerpt || "Bài viết trên Maison Dining.";
    const meta: any[] = [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
    ];
    if (p.cover_image_url) {
      meta.push({ property: "og:image", content: p.cover_image_url });
      meta.push({ name: "twitter:image", content: p.cover_image_url });
    }
    return { meta };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-32 max-w-2xl mx-auto px-6 text-center">
        <h1 className="font-serif text-3xl mb-3">Không tìm thấy bài viết</h1>
        <Link to="/blog" className="text-gold hover:underline">← Về Blog</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-32 max-w-2xl mx-auto px-6 text-center text-muted-foreground">{error.message}</div>
    </div>
  ),
  component: BlogPost,
});

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  const html = renderMarkdown(post.content || "");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt ?? "", url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); toast.success("Đã sao chép liên kết"); } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Magazine hero */}
      <header className="relative pt-24">
        {post.cover_image_url && (
          <div className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
            <img src={img(post.cover_image_url, { w: 1920 })} alt={post.title}
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          </div>
        )}
        <div className={`max-w-3xl mx-auto px-6 text-center ${post.cover_image_url ? "-mt-40 relative" : "pt-12"}`}>
          {post.blog_categories?.name && (
            <Link to="/blog/category/$slug" params={{ slug: post.blog_categories.slug }}
              className="text-[10px] tracking-[0.4em] uppercase text-gold hover:underline">
              {post.blog_categories.name}
            </Link>
          )}
          <h1 className="font-serif text-4xl md:text-6xl mt-4 leading-[1.1]">{post.title}</h1>
          {post.excerpt && <p className="text-lg md:text-xl text-muted-foreground italic mt-5 leading-relaxed">{post.excerpt}</p>}

          <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground mt-7">
            {post.published_at && (
              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />
                {new Date(post.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}</span>
            )}
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{post.reading_minutes} phút đọc</span>
            <span className="opacity-40">·</span>
            <button onClick={share} className="flex items-center gap-1.5 hover:text-gold transition">
              <Share2 className="h-3 w-3" /> Chia sẻ
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="h-px w-12 bg-gold/50" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase">Maison Journal</span>
            <span className="h-px w-12 bg-gold/50" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12 pb-16">
        <Link to="/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-gold mb-8">
          <ArrowLeft className="h-3 w-3" /> Tất cả bài viết
        </Link>

        <article
          className="magazine-article font-serif-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {post.tags?.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-2">
            {post.tags.map((t: string) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground hover:border-gold hover:text-gold transition">#{t}</span>
            ))}
          </div>
        )}
      </main>

      {related.length > 0 && (
        <section className="border-t border-border bg-card/30 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-10">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] tracking-[0.4em] uppercase text-gold">Đọc thêm cùng chủ đề</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((r: any) => (
                <Link key={r.id} to="/blog/$slug" params={{ slug: r.slug }} className="group block">
                  <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4 bg-secondary">
                    {r.cover_image_url && (
                      <img src={img(r.cover_image_url, { w: 600 })} alt={r.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                  </div>
                  <h3 className="font-serif text-xl leading-snug group-hover:text-gold transition line-clamp-2">{r.title}</h3>
                  <div className="text-xs text-muted-foreground mt-2 flex gap-3">
                    <span>{r.published_at ? new Date(r.published_at).toLocaleDateString("vi-VN") : ""}</span>
                    <span>·</span>
                    <span>{r.reading_minutes} phút</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

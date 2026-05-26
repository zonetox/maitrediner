import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data } = await (supabase as any).from("blog_posts")
      .select("*, blog_categories(name, slug)")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) throw notFound();
    return { post: data };
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
  const { post } = Route.useLoaderData();
  const html = renderMarkdown(post.content || "");
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-24 pb-20 max-w-3xl mx-auto px-6">
        <Link to="/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-gold mb-6">
          <ArrowLeft className="h-3 w-3" /> Tất cả bài viết
        </Link>

        {post.blog_categories?.name && (
          <Link to="/blog/category/$slug" params={{ slug: post.blog_categories.slug }}
            className="text-xs tracking-[0.3em] uppercase text-gold hover:underline">
            {post.blog_categories.name}
          </Link>
        )}
        <h1 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-muted-foreground mt-4">{post.excerpt}</p>}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-6 pb-6 border-b border-border">
          {post.published_at && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
              {new Date(post.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.reading_minutes} phút đọc</span>
        </div>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full rounded-2xl my-8 aspect-[16/9] object-cover" />
        )}

        <article className="prose-invert" dangerouslySetInnerHTML={{ __html: html }} />

        {post.tags?.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-2">
            {post.tags.map((t: string) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

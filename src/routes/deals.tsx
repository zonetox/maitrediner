import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Sparkles, Clock, Tag, Bookmark, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Ưu đãi nhà hàng — Maison Dining" },
      { name: "description", content: "Ưu đãi độc quyền từ các nhà hàng cao cấp trên Maison Dining." },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("deals")
        .select("*, restaurants(name, slug, city, cover_image_url)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function save(id: string) {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu ưu đãi");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, deal_id: id });
    if (error) toast.error(error.message);
    else toast.success("Đã lưu ưu đãi");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Đặc quyền thành viên</span>
            <h1 className="font-serif text-4xl md:text-5xl mt-3">Ưu đãi từ những bếp trưởng</h1>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-center py-20">Đang tải...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl">
              <Sparkles className="h-8 w-8 text-gold mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Chưa có ưu đãi đang hoạt động.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((d) => (
                <article key={d.id} className="relative p-8 rounded-2xl border border-border bg-card hover:border-gold transition overflow-hidden group">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-gold opacity-10 blur-2xl group-hover:opacity-20 transition" />
                  <div className="flex items-center justify-between mb-6">
                    {d.badge && (
                      <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">{d.badge}</span>
                    )}
                    {d.expires_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {new Date(d.expires_at).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <Sparkles className="h-6 w-6 text-gold mb-4" />
                  <h3 className="font-serif text-2xl leading-tight">{d.title}</h3>
                  {d.restaurants && (
                    <Link to="/r/$slug" params={{ slug: d.restaurants.slug }} className="text-xs uppercase tracking-wider text-gold mt-2 inline-block hover:underline">
                      {d.restaurants.name}
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.description}</p>
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    {d.tag ? (
                      <span className="flex items-center gap-2 text-gold font-medium text-sm">
                        <Tag className="h-4 w-4" /> {d.tag}
                      </span>
                    ) : <span />}
                    <button onClick={() => save(d.id)} className="text-sm hover:text-gold transition inline-flex items-center gap-1">
                      <Bookmark className="h-4 w-4" /> Lưu ưu đãi
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link to="/restaurants" className="inline-flex items-center gap-2 text-gold hover:underline">
              Khám phá thêm nhà hàng <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Clock, Tag, Bookmark, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function Deals() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("deals")
        .select("id, badge, title, description, expires_at, tag")
        .eq("is_active", true)
        .limit(3);
      setItems(data ?? []);
    })();
  }, []);

  async function save(id: string) {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu ưu đãi");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, deal_id: id });
    if (error) toast.error(error.message); else toast.success("Đã lưu ưu đãi");
  }

  if (items === null) return null;
  if (items.length === 0) return null;


  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Ưu đãi độc quyền</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Dành riêng cho thành viên Maison Dining</h2>
          </div>
          <Link to="/deals" className="text-sm text-gold hover:underline inline-flex items-center gap-2">
            Tất cả ưu đãi <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((d) => (
            <article key={d.id} className="relative p-8 rounded-2xl border border-border bg-card hover:border-gold transition-all overflow-hidden group">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-gold opacity-10 blur-2xl group-hover:opacity-20 transition" />
              <div className="flex items-center justify-between mb-6">
                {d.badge && (
                  <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">{d.badge}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {d.expires_at ? new Date(d.expires_at).toLocaleDateString("vi-VN") : "Có hạn"}
                </span>
              </div>
              <Sparkles className="h-6 w-6 text-gold mb-4" />
              <h3 className="font-serif text-2xl leading-tight">{d.title}</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.description}</p>
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                {d.tag ? (
                  <span className="flex items-center gap-2 text-gold font-medium">
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
      </div>
    </section>
  );
}

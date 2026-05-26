import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Clock, Tag, Bookmark, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { img } from "@/lib/img";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Deal = {
  id: string;
  badge: string | null;
  title: string;
  description: string | null;
  expires_at: string | null;
  tag: string | null;
  image_url: string | null;
};

export function Deals() {
  const { user } = useAuth();
  const [items, setItems] = useState<Deal[] | null>(null);
  const [active, setActive] = useState<Deal | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("deals")
        .select("id, badge, title, description, expires_at, tag, image_url")
        .eq("is_active", true)
        .limit(6);
      setItems(data ?? []);
    })();
  }, []);

  async function save(id: string) {
    if (!user) return toast.error("Vui lòng đăng nhập để lưu ưu đãi");
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, deal_id: id });
    if (error) toast.error(error.message);
    else toast.success("Đã lưu ưu đãi");
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((d) => (
            <button
              key={d.id}
              onClick={() => setActive(d)}
              className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:border-gold transition-all"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {d.image_url ? (
                  <img
                    src={img(d.image_url, { w: 480, h: 360 })}
                    alt={d.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-gold/10">
                    <Sparkles className="h-8 w-8 text-gold opacity-50" />
                  </div>
                )}
                {d.badge && (
                  <span className="absolute top-2 left-2 text-[10px] tracking-widest uppercase px-2 py-1 rounded-full bg-background/90 backdrop-blur border border-gold text-gold">
                    {d.badge}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-serif text-base leading-snug line-clamp-2">{d.title}</h3>
                {d.tag && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-gold">
                    <Tag className="h-3 w-3" /> {d.tag}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0">
          {active && (
            <>
              {active.image_url && (
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img
                    src={img(active.image_url, { w: 800, h: 450 })}
                    alt={active.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {active.badge && (
                      <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-gold text-gold">
                        {active.badge}
                      </span>
                    )}
                    {active.expires_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Hết hạn {new Date(active.expires_at).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="font-serif text-2xl leading-tight">{active.title}</DialogTitle>
                  {active.description && (
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
                      {active.description}
                    </DialogDescription>
                  )}
                </DialogHeader>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  {active.tag ? (
                    <span className="flex items-center gap-2 text-gold font-medium text-sm">
                      <Tag className="h-4 w-4" /> {active.tag}
                    </span>
                  ) : <span />}
                  <button
                    onClick={() => save(active.id)}
                    className="text-sm hover:text-gold transition inline-flex items-center gap-1"
                  >
                    <Bookmark className="h-4 w-4" /> Lưu ưu đãi
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

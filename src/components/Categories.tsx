import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import * as Lucide from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Cat = { id: string; name: string; slug: string; icon: string | null };

const FALLBACK: Cat[] = [
  { id: "1", name: "Fine dining", slug: "fine-dining", icon: "Wine" },
  { id: "2", name: "Omakase", slug: "omakase", icon: "Fish" },
  { id: "3", name: "Steakhouse", slug: "steakhouse", icon: "Beef" },
  { id: "4", name: "Bistro Pháp", slug: "bistro-phap", icon: "Croissant" },
  { id: "5", name: "Á đương đại", slug: "a-duong-dai", icon: "Soup" },
  { id: "6", name: "Patisserie", slug: "patisserie", icon: "Cake" },
];

export function Categories() {
  const [cats, setCats] = useState<Cat[]>(FALLBACK);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cuisine_categories")
        .select("id, name, slug, icon")
        .eq("is_active", true)
        .order("sort_order")
        .limit(12);
      if (data?.length) setCats(data);
    })();
  }, []);

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Phân loại</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Theo phong cách ẩm thực</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              Mỗi phong cách có trang riêng — tìm đúng trải nghiệm bạn muốn, không phân biệt địa điểm.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.map((c) => {
            const Icon = (c.icon && (Lucide as any)[c.icon]) || Lucide.Utensils;
            return (
              <Link
                key={c.id}
                to="/cuisines/$slug"
                params={{ slug: c.slug }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-gold transition-all text-left"
              >
                <Icon className="h-7 w-7 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <div className="font-serif text-lg">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Xem trang phong cách</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

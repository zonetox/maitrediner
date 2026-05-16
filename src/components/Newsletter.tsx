import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.info("Bạn đã đăng ký rồi, cảm ơn!");
      else toast.error(error.message);
    } else {
      toast.success("Đăng ký thành công!");
      setEmail("");
    }
  }

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Mail className="h-8 w-8 text-gold mx-auto mb-6" />
        <span className="text-xs tracking-[0.3em] uppercase text-gold">La Carte</span>
        <h2 className="font-serif text-4xl md:text-5xl mt-3 mb-5">
          Nhận ưu đãi sớm từ <span className="italic text-gradient-gold">những bếp trưởng</span> bạn yêu thích
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Mỗi tuần một bản tin ngắn: nhà hàng mới, set menu giới hạn, sự kiện riêng tư — gửi thẳng vào hộp thư.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto" onSubmit={submit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@cua-ban.com"
            className="flex-1 px-5 py-4 rounded-full bg-card border border-border focus:border-gold outline-none text-sm"
          />
          <button
            disabled={loading}
            className="px-8 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Đăng ký"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.</p>
      </div>
    </section>
  );
}

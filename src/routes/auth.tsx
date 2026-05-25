import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional(),
  as: z.enum(["customer", "restaurant"]).optional(),
  plan: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Đăng nhập — Maison Dining" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [as, setAs] = useState<"customer" | "restaurant">(search.as ?? "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        // Upgrade role if registering as restaurant owner
        if (as === "restaurant" && data.user) {
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: "restaurant_owner" });
        }
        toast.success("Đăng ký thành công! Đang đăng nhập...");
        if (search.plan) navigate({ to: "/partner/membership", search: { plan: search.plan } });
        else navigate({ to: as === "restaurant" ? "/partner" : "/account" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Chào mừng trở lại!");
        if (search.plan) navigate({ to: "/partner/membership", search: { plan: search.plan } });
        else navigate({ to: as === "restaurant" ? "/partner" : "/account" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-secondary/40 border-r border-border">
        <Link to="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-gold" />
          <span className="font-serif text-xl">Maison Dining<span className="text-gold">.</span></span>
        </Link>
        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Maison Dining</span>
          <h2 className="font-serif text-5xl mt-3 leading-tight">
            Một bàn tiệc đáng nhớ <span className="italic text-gradient-gold">bắt đầu từ đây.</span>
          </h2>
          <p className="text-muted-foreground mt-6 max-w-md">
            Đăng ký để lưu nhà hàng yêu thích, nhận ưu đãi sớm, hoặc đưa nhà hàng của bạn lên Maison Dining với 30 ngày dùng thử miễn phí.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© Maison Dining {new Date().getFullYear()}</p>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="max-w-md mx-auto w-full">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <UtensilsCrossed className="h-5 w-5 text-gold" />
            <span className="font-serif text-xl">Maison Dining.</span>
          </Link>

          <div className="flex bg-secondary rounded-full p-1 text-sm mb-8">
            <button
              type="button"
              onClick={() => setAs("customer")}
              className={`flex-1 py-2 rounded-full transition ${as === "customer" ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground"}`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setAs("restaurant")}
              className={`flex-1 py-2 rounded-full transition ${as === "restaurant" ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground"}`}
            >
              Chủ nhà hàng
            </button>
          </div>

          <h1 className="font-serif text-4xl mb-2">{mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản"}</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            {mode === "login" ? "Nhập thông tin để tiếp tục." : as === "restaurant" ? "Bắt đầu 30 ngày dùng thử miễn phí." : "Tham gia cùng 15.000+ thực khách."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Họ tên</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Mật khẩu</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none"
              />
            </div>
            {mode === "login" && (
              <div className="text-right">
                <Link to="/reset-password" className="text-xs text-gold hover:underline">Quên mật khẩu?</Link>
              </div>
            )}
            <button
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition disabled:opacity-60"
            >
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-gold hover:underline"
            >
              {mode === "login" ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

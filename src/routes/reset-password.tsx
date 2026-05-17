import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UtensilsCrossed, KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Đặt lại mật khẩu — Maître" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect recovery session from URL hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setStage("update");
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStage("update");
    });
    return () => subscription.unsubscribe();
  }, []);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Mật khẩu xác nhận không khớp");
    if (password.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã cập nhật mật khẩu thành công");
      navigate({ to: "/account" });
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-secondary/40 border-r border-border">
        <Link to="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-gold" />
          <span className="font-serif text-xl">Maître<span className="text-gold">.</span></span>
        </Link>
        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Bảo mật</span>
          <h2 className="font-serif text-5xl mt-3 leading-tight">
            Đặt lại mật khẩu <span className="italic text-gradient-gold">an toàn.</span>
          </h2>
          <p className="text-muted-foreground mt-6 max-w-md">
            Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email của bạn. Liên kết có hiệu lực trong 1 giờ.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© Maître {new Date().getFullYear()}</p>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="max-w-md mx-auto w-full">
          <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-8">
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </Link>

          <div className="h-12 w-12 rounded-full bg-gradient-gold grid place-items-center mb-6">
            <KeyRound className="h-5 w-5 text-primary-foreground" />
          </div>

          {stage === "request" ? (
            <>
              <h1 className="font-serif text-4xl mb-2">Quên mật khẩu?</h1>
              <p className="text-muted-foreground mb-8 text-sm">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
              <form onSubmit={sendReset} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
                </div>
                <button disabled={loading}
                  className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition disabled:opacity-60">
                  {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-serif text-4xl mb-2">Mật khẩu mới</h1>
              <p className="text-muted-foreground mb-8 text-sm">Tạo mật khẩu mới cho tài khoản của bạn.</p>
              <form onSubmit={updatePassword} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Mật khẩu mới</label>
                  <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu</label>
                  <input required type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-card border border-border focus:border-gold outline-none" />
                </div>
                <button disabled={loading}
                  className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition disabled:opacity-60">
                  {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

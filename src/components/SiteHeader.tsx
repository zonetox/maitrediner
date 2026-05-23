import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, UtensilsCrossed, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const nav = [
  { label: "Nhà hàng", to: "/restaurants" },
  { label: "Signature", to: "/signature" },
  { label: "Ưu đãi", to: "/deals" },
  { label: "Gói thành viên", to: "/membership" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "backdrop-blur-md bg-background/70 border-b border-border" : "bg-transparent border-transparent backdrop-blur-none"}`}>
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <UtensilsCrossed className={`h-5 w-5 ${scrolled ? "text-gold" : "text-gold"}`} />
          <span className={`font-serif text-xl tracking-wide ${scrolled ? "text-foreground" : "text-white drop-shadow-sm"}`}>
            Maître<span className="text-gold">.</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {nav.map((n) => (
            <Link key={n.label} to={n.to as any} className={`transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white drop-shadow-sm"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3 text-sm">
          <div className={scrolled ? "" : "[&_button]:text-white/80 [&_button]:hover:text-white"}>
            <ThemeSwitcher />
          </div>
          {user ? (
            <>
              {hasRole("admin") && (
                <Link to="/admin" className={scrolled ? "text-muted-foreground hover:text-gold" : "text-white/80 hover:text-white drop-shadow-sm"}>Admin</Link>
              )}
              {hasRole("restaurant_owner") && (
                <Link to="/partner" className={scrolled ? "text-muted-foreground hover:text-gold" : "text-white/80 hover:text-white drop-shadow-sm"}>Quản trị</Link>
              )}
              <Link to="/account" className={`flex items-center gap-2 ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white drop-shadow-sm"}`}>
                <User className="h-4 w-4" /> Tài khoản
              </Link>
              <button onClick={signOut} className={scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white drop-shadow-sm"}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate({ to: "/auth" })} className={`transition ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white drop-shadow-sm"}`}>Đăng nhập</button>
              <button
                onClick={() => navigate({ to: "/auth", search: { mode: "register", as: "restaurant" } })}
                className="px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition"
              >
                Đăng nhà hàng
              </button>
            </>
          )}
        </div>
        <button className={`md:hidden ${scrolled ? "text-foreground" : "text-white drop-shadow-sm"}`} onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          {nav.map((n) => (
            <Link key={n.label} to={n.to as any} className="block text-muted-foreground" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/account" className="block text-muted-foreground">Tài khoản</Link>
              {hasRole("restaurant_owner") && <Link to="/partner" className="block text-muted-foreground">Quản trị nhà hàng</Link>}
              {hasRole("admin") && <Link to="/admin" className="block text-muted-foreground">Admin</Link>}
              <button onClick={signOut} className="text-muted-foreground">Đăng xuất</button>
            </>
          ) : (
            <button
              onClick={() => navigate({ to: "/auth", search: { mode: "register", as: "restaurant" } })}
              className="w-full mt-2 px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground font-medium"
            >
              Đăng nhà hàng
            </button>
          )}
        </div>
      )}
    </header>
  );
}

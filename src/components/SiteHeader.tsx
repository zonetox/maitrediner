import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, UtensilsCrossed, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { label: "Khám phá", to: "/" },
  { label: "Nhà hàng", to: "/restaurants" },
  { label: "Ưu đãi", to: "/deals" },
  { label: "Gói thành viên", to: "/membership" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <UtensilsCrossed className="h-5 w-5 text-gold" />
          <span className="font-serif text-xl tracking-wide">
            Maître<span className="text-gold">.</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {nav.map((n) => (
            <Link key={n.label} to={n.to as any} className="text-muted-foreground hover:text-foreground transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3 text-sm">
          {user ? (
            <>
              {hasRole("admin") && (
                <Link to="/admin" className="text-muted-foreground hover:text-gold">Admin</Link>
              )}
              {hasRole("restaurant_owner") && (
                <Link to="/partner" className="text-muted-foreground hover:text-gold">Quản trị</Link>
              )}
              <Link to="/account" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" /> Tài khoản
              </Link>
              <button onClick={signOut} className="text-muted-foreground hover:text-foreground">Đăng xuất</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate({ to: "/auth" })} className="text-muted-foreground hover:text-foreground transition">Đăng nhập</button>
              <button
                onClick={() => navigate({ to: "/auth", search: { mode: "register", as: "restaurant" } })}
                className="px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition"
              >
                Đăng nhà hàng
              </button>
            </>
          )}
        </div>
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="menu">
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

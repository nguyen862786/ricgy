import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, Grid, Search, ShoppingBag, User, Battery, Wifi, Signal } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export function MobileAppLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState("");
  const { cartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="lg:min-h-screen lg:w-full lg:flex lg:items-center lg:justify-center lg:bg-linear-to-br lg:from-slate-900 lg:via-zinc-800 lg:to-slate-950 lg:p-6">
      {/* Background decorations for desktop */}
      <div className="hidden lg:block absolute top-10 left-[15%] w-96 h-96 bg-[var(--fuchsia-pop)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden lg:block absolute bottom-10 right-[15%] w-96 h-96 bg-[var(--teal-trans)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile Screen Mockup Container */}
      <div className="brand-ricgy relative w-full min-h-screen lg:w-[410px] lg:h-[840px] lg:min-h-0 bg-background lg:rounded-[44px] lg:border-[10px] lg:border-neutral-900 lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
        {/* Top Status Bar (Fake phone status bar) */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-background/80 backdrop-blur-xs flex items-center justify-between px-6 z-40 text-foreground text-xs font-medium select-none pointer-events-none">
          <span>{time}</span>
          {/* Notch on Desktop */}
          <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[22px] bg-neutral-900 rounded-b-xl" />
          <div className="flex items-center gap-1">
            <Signal className="size-3.5" />
            <Wifi className="size-3.5" />
            <Battery className="size-4" />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto pt-10 pb-16 scrollbar-none">
          {children}
        </div>

        {/* Bottom Tab Bar Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around pb-1 z-40 select-none">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive("/") ? "text-[var(--fuchsia-pop)] scale-110" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="size-5" />
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </Link>

          <Link
            to="/danh-muc"
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive("/danh-muc") ? "text-[var(--fuchsia-pop)] scale-110" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="size-5" />
            <span className="text-[10px] font-medium mt-0.5">Khám phá</span>
          </Link>

          <Link
            to="/tim-kiem"
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive("/tim-kiem") ? "text-[var(--fuchsia-pop)] scale-110" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="size-5" />
            <span className="text-[10px] font-medium mt-0.5">Tìm kiếm</span>
          </Link>

          <Link
            to="/gio-hang"
            className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive("/gio-hang") ? "text-[var(--fuchsia-pop)] scale-110" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full size-4 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium mt-0.5">Giỏ hàng</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive("/profile") ? "text-[var(--fuchsia-pop)] scale-110" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="size-5" />
            <span className="text-[10px] font-medium mt-0.5">Tôi</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

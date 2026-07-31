import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/cong-so", label: "Công sở" },
  { to: "/the-thao", label: "Thể thao" },
  { to: "/dam-di-choi", label: "Đầm đi chơi" },
  { to: "/dam-ngu", label: "Đầm ngủ" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/douyin", label: "Douyin Mode" },
  { to: "/ve-chung-toi", label: "Về chúng tôi" },
  { to: "/lien-he", label: "Liên hệ" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10 h-16 lg:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-1.5 group">
          <span className="font-serif text-2xl lg:text-3xl tracking-tight">{SITE.name}</span>
          <span className="font-serif italic text-sm text-primary">{SITE.tagline}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV.slice(1, 6).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-[13px] uppercase tracking-[0.18em] text-foreground/75 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/lien-he"
            className="text-[13px] uppercase tracking-[0.18em] text-foreground/75 hover:text-primary"
          >
            Liên hệ
          </Link>
          <a
            href={SITE.zalo}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-primary text-primary-foreground text-[13px] uppercase tracking-[0.18em] hover:bg-accent transition-colors"
          >
            Đặt qua Zalo
          </a>
        </div>

        <button
          className="lg:hidden p-2 -mr-2"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="px-5 py-6 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 font-serif text-2xl text-foreground hover:text-primary"
                activeProps={{ className: "text-primary italic" }}
              >
                {n.label}
              </Link>
            ))}
            <a
              href={SITE.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex justify-center px-5 py-3 bg-primary text-primary-foreground uppercase tracking-[0.18em] text-sm"
            >
              Đặt qua Zalo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

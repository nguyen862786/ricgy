import { Link } from "@tanstack/react-router";
import { SITE, CATEGORIES } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 grid gap-12 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-3xl">{SITE.name}</span>
            <span className="font-serif italic text-primary">{SITE.tagline}</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Thời trang nữ hiện đại — đồng hành cùng nàng trong mọi khoảnh khắc của ngày dài.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-4">
            Bộ sưu tập
          </h4>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/${c.slug}`} className="hover:text-primary transition-colors">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-4">Khám phá</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/lookbook" className="hover:text-primary">Lookbook</Link></li>
            <li><Link to="/huong-dan-size" className="hover:text-primary">Hướng dẫn chọn size</Link></li>
            <li><Link to="/ve-chung-toi" className="hover:text-primary">Về chúng tôi</Link></li>
            <li><Link to="/lien-he" className="hover:text-primary">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-4">Kết nối</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href={SITE.facebook} target="_blank" rel="noreferrer" className="hover:text-primary">Facebook</a></li>
            <li><a href={SITE.instagram} target="_blank" rel="noreferrer" className="hover:text-primary">Instagram</a></li>
            <li><a href={SITE.zalo} target="_blank" rel="noreferrer" className="hover:text-primary">Zalo</a></li>
            <li><a href={`tel:${SITE.phone}`} className="hover:text-primary">{SITE.phone}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {SITE.name}. Đã đăng ký nhãn hiệu.</p>
          <p className="font-serif italic">Mặc đẹp mỗi khoảnh khắc.</p>
        </div>
      </div>
    </footer>
  );
}

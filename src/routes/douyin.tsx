import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { VariantBoldCaption } from "@/components/site/douyin/VariantBoldCaption";
import { VariantCinematic } from "@/components/site/douyin/VariantCinematic";
import { VariantY2K } from "@/components/site/douyin/VariantY2K";
import { ViewCounter } from "@/components/site/douyin/ViewCounter";
import { ArrowDown, ArrowRight, Flame, Film, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/douyin")({
  head: () => ({
    meta: [
      { title: "Douyin Mode — RICGY" },
      { name: "description", content: "3 mẫu thiết kế viral kiểu Douyin/TikTok shop cho RICGY — chọn vibe yêu thích." },
      { property: "og:title", content: "Douyin Mode — RICGY" },
      { property: "og:description", content: "Hot Trend · Soft Girl Cinematic · Y2K Glossy Pop." },
      { property: "og:image", content: hero },
    ],
  }),
  component: DouyinPage,
});

const VARIANTS = [
  {
    no: "01",
    name: "Hot Trend Bold Caption",
    sub: "Viral · Caption to · Sticker nháy",
    color: "var(--douyin-yellow)",
    icon: Flame,
    desc: "Caption vàng-đen vạch dày, sticker SALE nhấp nháy, ticker view-count chạy số, progress bar đỏ — đúng năng lượng livestream chốt đơn của Douyin shop.",
    fits: "Flash sale · drop hàng mới · video viral kéo traffic",
    Component: VariantBoldCaption,
  },
  {
    no: "02",
    name: "Soft Girl Cinematic",
    sub: "Phim ảnh · Tone be · Slow",
    color: "var(--cocoa)",
    icon: Film,
    desc: "Tone be-nâu sữa, film grain, vignette mềm, phụ đề serif italic kiểu phim châu Âu. Cảm giác 'sang xịn mịn' cho beauty/lifestyle reel.",
    fits: "Lookbook · campaign mood · brand storytelling",
    Component: VariantCinematic,
  },
  {
    no: "03",
    name: "Y2K Glossy Pop",
    sub: "Chrome · Sparkle · It-girl",
    color: "var(--fuchsia-pop)",
    icon: Sparkles,
    desc: "Gradient chrome bạc-hồng-tím, bubble tròn bóng, sparkle xoay liên tục, sticker giá xoay tròn. Vibe Gen-Z TikTok shop trẻ trung.",
    fits: "Drop sản phẩm trẻ · collab idol · capsule limited",
    Component: VariantY2K,
  },
] as const;

function DouyinPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 px-5 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-foreground" />
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, var(--fuchsia-pop) 0%, transparent 50%), radial-gradient(circle at 80% 70%, var(--teal-trans) 0%, transparent 50%)",
          }}
        />
        <div className="mx-auto max-w-[1400px] text-background">
          <div className="flex items-center gap-3 font-mono-tag text-[11px] uppercase">
            <span className="size-2 rounded-full bg-[var(--douyin-red)]" style={{ animation: "douyin-blink 1s infinite" }} />
            LIVE · For You · <ViewCounter start={84200} /> watching
          </div>
          <h1 className="mt-6 font-display text-6xl lg:text-9xl leading-[0.85]">
            DOUYIN<br />
            <span className="font-serif italic normal-case text-[var(--douyin-yellow)]">mode</span>
          </h1>
          <p className="mt-6 max-w-xl text-base lg:text-lg text-background/70">
            3 hướng thiết kế viral cho RICGY — từ caption vàng-đen kiểu flash-sale tới reel cinematic
            "soft-girl" và Y2K glossy pop. Lướt xem, chọn vibe, mình áp luôn vào trang chủ.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {VARIANTS.map((v) => (
              <a
                key={v.no}
                href={`#variant-${v.no}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-background/30 text-background hover:bg-background hover:text-foreground transition-colors font-mono-tag text-[11px] uppercase"
              >
                <span style={{ color: v.color }}>●</span> {v.no} — {v.name}
              </a>
            ))}
          </div>
          <div className="mt-12 flex items-center gap-2 font-mono-tag text-[11px] uppercase text-background/50">
            <ArrowDown className="size-3 animate-bounce" /> Cuộn xem 3 mẫu
          </div>
        </div>
      </section>

      {/* VARIANTS */}
      {VARIANTS.map((v, i) => {
        const Icon = v.icon;
        const reverse = i % 2 === 1;
        const zalo = `${SITE.zalo}?text=${encodeURIComponent(`Em chào RICGY, em thích style Douyin "${v.name}" — mình triển khai vibe này nhé!`)}`;
        return (
          <section
            key={v.no}
            id={`variant-${v.no}`}
            className={`px-5 lg:px-10 py-20 lg:py-32 ${i === 1 ? "bg-[var(--douyin-cinema)]" : i === 2 ? "bg-secondary/40" : "bg-background"}`}
          >
            <div className={`mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
              {/* Phone */}
              <Reveal>
                <div className="relative">
                  <div
                    className="absolute -inset-12 -z-10 opacity-30 blur-3xl"
                    style={{ background: v.color }}
                  />
                  <v.Component />
                </div>
              </Reveal>

              {/* Copy */}
              <Reveal delay={0.1}>
                <div>
                  <div className="flex items-center gap-3 font-mono-tag text-[11px] uppercase" style={{ color: v.color }}>
                    <Icon className="size-4" /> Variant {v.no} — {v.sub}
                  </div>
                  <h2 className="mt-4 font-display text-5xl lg:text-7xl leading-[0.9]">
                    {v.name.split(" ").slice(0, -1).join(" ")}{" "}
                    <span className="font-serif italic normal-case" style={{ color: v.color }}>
                      {v.name.split(" ").slice(-1)}
                    </span>
                  </h2>
                  <p className="mt-6 text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md">
                    {v.desc}
                  </p>
                  <div className="mt-6 pt-6 border-t border-foreground/10">
                    <p className="font-mono-tag text-[10px] uppercase text-muted-foreground">Hợp với</p>
                    <p className="mt-2 font-serif italic text-xl">{v.fits}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href={zalo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-foreground text-background font-mono-tag text-[12px] uppercase hover:bg-[var(--fuchsia-pop)] transition-colors"
                    >
                      Chốt mẫu này <ArrowRight className="size-4" />
                    </a>
                    <a
                      href={`#variant-${VARIANTS[(i + 1) % 3].no}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 border border-foreground/30 font-mono-tag text-[12px] uppercase hover:border-foreground"
                    >
                      Xem mẫu kế
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      {/* PICK YOUR VIBE */}
      <section className="px-5 lg:px-10 py-20 lg:py-32 bg-foreground text-background">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-mono-tag text-[11px] uppercase text-[var(--douyin-yellow)]">Pick your vibe</p>
          <h2 className="mt-4 font-display text-5xl lg:text-8xl leading-[0.9]">
            CHỌN <span className="font-serif italic normal-case text-[var(--douyin-yellow)]">một</span><br />
            ÁP CẢ TRANG.
          </h2>
          <p className="mt-6 max-w-xl text-background/70">
            Sau khi bạn chọn, mình sẽ áp variant đó vào hero trang chủ + ProductCard thật. Nhanh, gọn, viral.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {VARIANTS.map((v) => {
              const zalo = `${SITE.zalo}?text=${encodeURIComponent(`RICGY ơi, em chốt style "${v.name}" cho trang chủ nhé!`)}`;
              return (
                <a
                  key={v.no}
                  href={zalo}
                  target="_blank"
                  rel="noreferrer"
                  className="group p-6 border border-background/20 hover:border-background hover:bg-background/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl">{v.no}</span>
                    <span className="size-3 rounded-full" style={{ background: v.color }} />
                  </div>
                  <h3 className="mt-6 font-serif text-2xl">{v.name}</h3>
                  <p className="mt-2 text-sm text-background/60">{v.sub}</p>
                  <p className="mt-6 font-mono-tag text-[11px] uppercase flex items-center gap-2 text-[var(--douyin-yellow)] group-hover:gap-4 transition-all">
                    Chốt vibe này <ArrowRight className="size-3" />
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

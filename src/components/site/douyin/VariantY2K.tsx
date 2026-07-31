import { PhoneMockup } from "./PhoneMockup";
import img from "@/assets/look-3.jpg";

function Sparkle({ className = "", size = 24, delay = 0 }: { className?: string; size?: number; delay?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={{ animation: `douyin-spin 4s linear infinite`, animationDelay: `${delay}s` }}>
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  );
}

export function VariantY2K() {
  return (
    <PhoneMockup tone="chrome">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--douyin-chrome-1) 0%, var(--douyin-chrome-2) 50%, var(--douyin-chrome-3) 100%)",
          backgroundSize: "200% 200%",
          animation: "douyin-shimmer 6s ease-in-out infinite alternate",
        }}
      />

      {/* Bubble photo frame */}
      <div className="absolute top-[14%] left-1/2 -translate-x-1/2 size-56 rounded-full overflow-hidden border-[6px] border-white shadow-[0_10px_30px_rgba(233,30,118,0.4)]">
        <img src={img} alt="" className="size-full object-cover" />
      </div>

      {/* Sparkles */}
      <Sparkle className="absolute top-[12%] left-6 text-white" size={28} />
      <Sparkle className="absolute top-[40%] right-6 text-[var(--fuchsia-pop)]" size={20} delay={1} />
      <Sparkle className="absolute top-[55%] left-8 text-white" size={16} delay={2} />

      {/* Price sticker */}
      <div
        className="absolute top-[10%] right-4 size-20 rounded-full bg-[var(--fuchsia-pop)] text-white flex flex-col items-center justify-center text-center"
        style={{ animation: "douyin-spin 12s linear infinite" }}
      >
        <span className="font-mono-tag text-[9px] uppercase">Only</span>
        <span className="font-display text-base">490K</span>
      </div>

      {/* Headline */}
      <div className="absolute top-[58%] left-0 right-0 px-5 text-center">
        <h3 className="font-display text-3xl leading-[0.9] text-foreground">
          GLOSSY<br />
          <span className="italic font-serif text-[var(--fuchsia-pop)] normal-case">it-girl</span><br />
          ENERGY
        </h3>
        <p className="mt-2 text-[11px] font-mono-tag uppercase tracking-[0.2em] text-foreground/70">
          Y2K · drop 03 · live now
        </p>
      </div>

      {/* CTA pill */}
      <div className="absolute bottom-6 left-4 right-4 z-10 py-3 text-center rounded-full font-display text-base text-white shadow-[0_10px_25px_rgba(233,30,118,0.5)]"
        style={{
          background: "linear-gradient(90deg, var(--fuchsia-pop), var(--teal-trans))",
        }}
      >
        ✨ SHOP THE LOOK ✨
      </div>
    </PhoneMockup>
  );
}

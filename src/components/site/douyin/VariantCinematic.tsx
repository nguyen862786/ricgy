import { PhoneMockup } from "./PhoneMockup";
import img from "@/assets/look-2.jpg";

export function VariantCinematic() {
  return (
    <PhoneMockup tone="cinema">
      {/* Letterbox cinema */}
      <div className="absolute inset-0 bg-[var(--douyin-cinema)]" />
      <div className="absolute top-[18%] bottom-[18%] left-0 right-0 overflow-hidden">
        <img src={img} alt="" className="absolute inset-0 size-full object-cover" style={{ filter: "sepia(0.15) contrast(0.95) brightness(0.95)" }} />
        {/* Film grain */}
        <svg className="absolute inset-0 size-full opacity-[0.18] mix-blend-overlay pointer-events-none">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.55) 100%)" }} />
      </div>

      {/* Top label */}
      <div className="absolute top-12 left-0 right-0 z-10 flex justify-between px-5 text-foreground/70 text-[10px] font-mono-tag">
        <span>● REC 00:23</span>
        <span>RICGY · SS26</span>
      </div>

      {/* Subtitle */}
      <div className="absolute bottom-[22%] left-0 right-0 px-6 z-10 text-center">
        <p className="font-serif italic text-2xl text-foreground leading-tight">
          "— a quiet morning,<br />nothing to prove."
        </p>
        <p className="mt-3 text-[10px] font-mono-tag tracking-[0.3em] text-foreground/60 uppercase">
          Soft Girl · Reel 02
        </p>
      </div>

      {/* Bottom mark */}
      <div className="absolute bottom-5 left-0 right-0 z-10 flex flex-col items-center gap-2">
        <div className="h-px w-12 bg-foreground/40" />
        <button className="text-[11px] font-mono-tag tracking-[0.25em] uppercase text-foreground border border-foreground/40 px-4 py-2">
          Watch the full reel
        </button>
      </div>
    </PhoneMockup>
  );
}

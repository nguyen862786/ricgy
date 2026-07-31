import { Heart, MessageCircle, Share2, Music2, Eye } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";
import { ViewCounter } from "./ViewCounter";
import img from "@/assets/look-1.jpg";

export function VariantBoldCaption() {
  return (
    <PhoneMockup>
      {/* Background image */}
      <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />

      {/* Top bar */}
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-6 text-white text-[12px] font-mono-tag z-10">
        <span className="opacity-60">Following</span>
        <span className="font-bold border-b-2 border-[var(--douyin-yellow)] pb-1">For You</span>
        <span className="opacity-60">Live</span>
      </div>

      {/* Bold caption */}
      <div className="absolute top-[28%] left-4 right-16 z-10 space-y-2">
        <span
          className="inline-block px-2 py-1 text-[11px] font-mono-tag uppercase"
          style={{ background: "var(--douyin-red)", color: "#fff", animation: "douyin-blink 1s infinite" }}
        >
          🔥 Sale 50%
        </span>
        <h3
          className="font-display text-3xl leading-[0.95] italic"
          style={{
            color: "var(--douyin-yellow)",
            WebkitTextStroke: "2px #000",
            textShadow: "3px 3px 0 #000",
          }}
        >
          CHỐT NHANH<br />KẺO HẾT SIZE
        </h3>
        <p className="text-white text-[12px] font-mono-tag drop-shadow">@ricgy.official · #ootd #saleshock</p>
      </div>

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10 text-white">
        <div className="flex flex-col items-center gap-1">
          <Heart className="size-7 fill-[var(--douyin-red)] text-[var(--douyin-red)]" style={{ animation: "douyin-pulse 1.2s infinite" }} />
          <span className="text-[10px] font-mono-tag">128.4K</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="size-7" />
          <span className="text-[10px] font-mono-tag">2.1K</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Share2 className="size-7" />
          <span className="text-[10px] font-mono-tag">Share</span>
        </div>
        <div className="size-9 rounded-full border-2 border-white" style={{ animation: "douyin-spin 6s linear infinite" }}>
          <Music2 className="size-4 m-auto mt-2 text-white" />
        </div>
      </div>

      {/* View counter */}
      <div className="absolute top-20 left-4 z-10 flex items-center gap-1 text-white text-[11px]">
        <Eye className="size-3" /> <ViewCounter />
      </div>

      {/* Bottom CTA */}
      <div
        className="absolute bottom-6 left-4 right-4 z-10 py-3 text-center font-display text-lg"
        style={{
          background: "var(--douyin-yellow)",
          color: "#000",
          animation: "douyin-pulse 1.4s infinite",
        }}
      >
        ĐẶT NGAY ›
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-[var(--douyin-red)]" style={{ animation: "douyin-progress 8s linear infinite" }} />
    </PhoneMockup>
  );
}

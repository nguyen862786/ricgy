import { ReactNode } from "react";

export function PhoneMockup({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "chrome" | "cinema" }) {
  const frame =
    tone === "chrome"
      ? "bg-gradient-to-b from-[var(--douyin-chrome-1)] via-[var(--douyin-chrome-2)] to-[var(--douyin-chrome-3)]"
      : tone === "cinema"
      ? "bg-[var(--douyin-cinema)]"
      : "bg-foreground";
  return (
    <div className={`relative mx-auto w-full max-w-[340px] aspect-[9/19.5] rounded-[42px] p-[10px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] ${frame}`}>
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-28 h-6 rounded-full bg-foreground" />
      <div className="relative size-full overflow-hidden rounded-[34px] bg-background">
        {children}
      </div>
    </div>
  );
}

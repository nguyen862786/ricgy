import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

export function ZaloButton() {
  return (
    <a
      href={SITE.zalo}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nhắn Zalo"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3 pr-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:bg-accent transition-colors"
    >
      <MessageCircle className="size-5" />
      <span className="text-sm uppercase tracking-wider">Tư vấn</span>
    </a>
  );
}

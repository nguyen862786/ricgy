import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Popup = {
  id: string;
  popup_title: string | null;
  popup_body: string | null;
  popup_image_url: string | null;
  popup_cta_text: string | null;
  popup_cta_url: string | null;
  popup_dismiss_hours: number;
  promo_code: string | null;
  name: string;
};

export function CampaignPopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select(
          "id,name,promo_code,popup_title,popup_body,popup_image_url,popup_cta_text,popup_cta_url,popup_dismiss_hours",
        )
        .eq("popup_enabled", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled || !data || data.length === 0) return;
      const p = data[0] as Popup;
      try {
        const key = `popup_dismissed_${p.id}`;
        const dismissedAt = Number(localStorage.getItem(key) || 0);
        const windowMs = (p.popup_dismiss_hours || 24) * 3600 * 1000;
        if (dismissedAt && Date.now() - dismissedAt < windowMs) return;
      } catch (error) {
        console.error("LocalStorage Error:", error);
      }
      setPopup(p);
      // small delay for nicer UX
      setTimeout(() => setOpen(true), 600);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    if (popup) {
      try {
        localStorage.setItem(`popup_dismissed_${popup.id}`, String(Date.now()));
      } catch (error) {
        console.error("LocalStorage Error:", error);
      }
    }
    setOpen(false);
  }

  if (!popup) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {popup.popup_image_url && (
          <img
            src={popup.popup_image_url}
            alt={popup.popup_title || popup.name}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-xl">{popup.popup_title || popup.name}</DialogTitle>
            {popup.popup_body && (
              <DialogDescription className="whitespace-pre-line">
                {popup.popup_body}
              </DialogDescription>
            )}
          </DialogHeader>
          {popup.promo_code && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
              <span className="text-xs text-muted-foreground">Mã ưu đãi:</span>
              <Badge variant="default" className="text-sm font-mono">
                {popup.promo_code}
              </Badge>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={dismiss}>
              Để sau
            </Button>
            {popup.popup_cta_url ? (
              <Button asChild onClick={dismiss}>
                <a
                  href={popup.popup_cta_url}
                  target={popup.popup_cta_url.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                >
                  {popup.popup_cta_text || "Khám phá ngay"}
                </a>
              </Button>
            ) : (
              <Button onClick={dismiss}>{popup.popup_cta_text || "Đã hiểu"}</Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

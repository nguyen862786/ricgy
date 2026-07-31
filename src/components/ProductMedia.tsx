import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2, Loader2, Film } from "lucide-react";
import { toast } from "sonner";

export type MediaItem = { path: string; type: "image" | "video" };

const BUCKET = "product-media";

export function ProductMedia({ productId, media }: { productId: string; media: MediaItem[] }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<MediaItem[]>(media ?? []);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems(media ?? []);
  }, [media]);

  useEffect(() => {
    let active = true;
    (async () => {
      const paths = items.map((m) => m.path).filter((p) => !urls[p]);
      if (paths.length === 0) return;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
      if (!active || !data) return;
      setUrls((prev) => {
        const next = { ...prev };
        data.forEach((d) => {
          if (d.signedUrl && d.path) next[d.path] = d.signedUrl;
        });
        return next;
      });
    })();
    return () => {
      active = false;
    };
  }, [items, urls]);

  async function persist(next: MediaItem[]) {
    setItems(next);
    const { error } = await supabase.from("products").update({ media: next }).eq("id", productId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const added: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        added.push({ path, type: file.type.startsWith("video") ? "video" : "image" });
      }
      if (added.length) await persist([...items, ...added]);
      if (added.length) toast.success(`Đã tải lên ${added.length} tệp`);
    } finally {
      setUploading(false);
    }
  }

  async function removeItem(m: MediaItem) {
    await supabase.storage.from(BUCKET).remove([m.path]);
    await persist(items.filter((x) => x.path !== m.path));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <ImagePlus className="h-4 w-4" /> Thư viện media
        </Label>
        <Button asChild size="sm" variant="outline" disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="mr-1 h-3.5 w-3.5" />
            )}
            Tải ảnh/video
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa có media. Hỗ trợ nhiều ảnh và video.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((m) => (
            <div
              key={m.path}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              {m.type === "video" ? (
                urls[m.path] ? (
                  <video src={urls[m.path]} className="h-full w-full object-cover" muted />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-5 w-5 text-muted-foreground" />
                  </div>
                )
              ) : urls[m.path] ? (
                <img src={urls[m.path]} alt="media" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeItem(m)}
                className="absolute right-1 top-1 rounded-md bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                title="Xóa"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const TryOnInput = z.object({
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(40),
  gender: z.string().min(1).max(20),
  color: z.string().max(60).optional().default(""),
  size: z.string().max(20).optional().default(""),
  material: z.string().max(60).optional().default(""),
  notes: z.string().max(300).optional().default(""),
});

function buildPrompt(d: z.infer<typeof TryOnInput>): string {
  const modelDesc =
    d.gender === "male"
      ? "a male fashion model"
      : d.gender === "kids"
        ? "a child fashion model"
        : "a female fashion model";
  const parts = [
    `Full-body editorial studio photograph of ${modelDesc} wearing "${d.productName}".`,
    d.color ? `Color: ${d.color}.` : "",
    d.material ? `Fabric/material: ${d.material}.` : "",
    d.size ? `Garment fit for size ${d.size}.` : "",
    d.notes ? `${d.notes}.` : "",
    "Clean light-grey studio background, soft natural lighting, photorealistic, high fashion lookbook style, sharp focus, the garment clearly visible.",
  ];
  return parts.filter(Boolean).join(" ");
}

export const generateTryOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TryOnInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Thiếu cấu hình AI (LOVABLE_API_KEY)");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        prompt: buildPrompt(data),
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Hệ thống AI đang quá tải, vui lòng thử lại sau ít phút.");
      if (res.status === 402) throw new Error("Đã hết hạn mức tín dụng AI. Vui lòng nạp thêm để tiếp tục.");
      throw new Error(`Lỗi tạo ảnh AI: ${txt.slice(0, 180)}`);
    }

    const json = (await res.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const item = json.data?.[0];
    let image: string | null = null;
    if (item?.b64_json) image = `data:image/png;base64,${item.b64_json}`;
    else if (item?.url) image = item.url;

    if (!image) throw new Error("AI không trả về hình ảnh hợp lệ.");
    return { image };
  });

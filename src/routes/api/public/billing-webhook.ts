import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(5).max(200),
  sig: z.string().min(16).max(200),
});

// Webhook giả lập cổng thanh toán: kích hoạt store khi "quét QR thành công"
export const Route = createFileRoute("/api/public/billing-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { verifyToken, activateStore } = await import("@/lib/billing.server");
        if (!verifyToken(parsed.token, parsed.sig)) {
          return new Response(JSON.stringify({ ok: false, error: "Chữ ký không hợp lệ" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const [storeId, plan, monthsStr] = parsed.token.split(".");
        const months = Number(monthsStr);
        if (!storeId || !["starter", "pro", "combo"].includes(plan) || !Number.isFinite(months)) {
          return new Response(JSON.stringify({ ok: false, error: "Token sai định dạng" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const res = await activateStore(storeId, plan as any, months);
        return new Response(JSON.stringify({ ok: true, ...res }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

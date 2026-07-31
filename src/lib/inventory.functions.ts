import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertStaff(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (!data || data.length === 0) throw new Error("Không có quyền");
}

const itemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().max(255).optional(),
  qty: z.number().positive().max(1_000_000),
  unit_cost: z.number().min(0).max(1_000_000_000).default(0),
});

const postInput = z.object({
  type: z.enum(["purchase", "transfer", "writeoff"]),
  storeId: z.string().uuid().nullable().optional(),
  toStoreId: z.string().uuid().nullable().optional(),
  note: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1).max(200),
});

function genCode(type: string) {
  const map: Record<string, string> = { purchase: "PN", transfer: "DC", writeoff: "XH" };
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `${map[type] ?? "PK"}-${seq}`;
}

// Lập + ghi sổ phiếu kho (nhập / điều chuyển / xuất hủy)
export const postInventoryDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => postInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);

    if (data.type === "transfer" && !data.toStoreId) {
      throw new Error("Điều chuyển cần chọn cửa hàng nhận");
    }

    const totalValue = data.items.reduce((s, it) => s + it.qty * it.unit_cost, 0);
    const now = new Date().toISOString();

    const { data: doc, error } = await supabaseAdmin
      .from("inventory_docs")
      .insert({
        code: genCode(data.type),
        type: data.type,
        store_id: data.storeId ?? null,
        to_store_id: data.toStoreId ?? null,
        status: "posted",
        note: data.note ?? null,
        total_value: totalValue,
        created_by: context.userId,
        posted_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("inventory_items").insert(
      data.items.map((it) => ({
        doc_id: doc.id,
        product_id: it.product_id,
        product_name: it.product_name ?? null,
        qty: it.qty,
        unit_cost: it.unit_cost,
      })),
    );

    // Cập nhật tồn kho + giá vốn bình quân gia quyền
    for (const it of data.items) {
      const { data: p } = await supabaseAdmin
        .from("products")
        .select("stock, avg_cost")
        .eq("id", it.product_id)
        .single();
      const oldStock = Number(p?.stock ?? 0);
      const oldAvg = Number(p?.avg_cost ?? 0);

      if (data.type === "purchase") {
        const newStock = oldStock + it.qty;
        const newAvg =
          newStock > 0 ? (oldStock * oldAvg + it.qty * it.unit_cost) / newStock : it.unit_cost;
        await supabaseAdmin
          .from("products")
          .update({ stock: Math.round(newStock), avg_cost: newAvg })
          .eq("id", it.product_id);
      } else if (data.type === "writeoff") {
        const newStock = Math.max(0, oldStock - it.qty);
        await supabaseAdmin
          .from("products")
          .update({ stock: Math.round(newStock) })
          .eq("id", it.product_id);
      }
      // transfer: ghi nhận luân chuyển, không đổi tổng tồn (sản phẩm dùng tồn kho gộp)
    }

    return { ok: true, id: doc.id, code: doc.code, total_value: totalValue };
  });

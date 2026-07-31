## Đối soát hiện trạng vs PRD

**Đã có (chạy được):**

- RBAC (owner/admin/agent/affiliate/customer), `has_role`, `user_roles`, sidebar theo role.
- Dashboard, Sản phẩm (CRUD cơ bản: giá/cashback/affiliate-rate/tồn kho).
- Mã khuyến mãi (CRUD `promo_codes` cơ bản: % giảm, đơn tối thiểu, giới hạn).
- Đơn hàng (tạo đơn, chốt `paid` → cộng ví cashback/hoa hồng, trừ kho) qua server fn.
- Khách hàng + Customer 360, tiers, tags/ghi chú, CSV.
- Affiliate (link giới thiệu, click, doanh số), Ví, Duyệt rút tiền, Campaign popup.
- Cấu hình bật/tắt agent/affiliate/cashback.

**Chưa có / chưa hoàn thiện (cần build):**

1. Multi-tenant chọn ngành hàng (F&B/Nước đóng chai/Khách sạn/Thời trang) + biến đổi field động ở /products, /orders.
2. Multi-store (điểm bán) — chưa có khái niệm cửa hàng.
3. Products: tải media, variants động theo ngành, nút Clone.
4. Promos: Flash Sale/Happy Hour, Combo/Bundle, rule nâng cao (mua X tặng Y, giảm theo hạng).
5. Loyalty động + eVoucher trong /customers; tách rõ 2 luồng /affiliate (khách mời bạn vs đại lý/KOL).
6. Orders: chọn luồng tiền (điểm bán vs công ty tổng), E-Invoice adapter (Misa/Viettel giả lập, real-time + gom cuối ngày).
7. Chốt ca (Shift Management) với chênh lệch tiền + lý do.
8. Kho vận: phiếu nhập (giá vốn bình quân gia quyền), điều chuyển store, xuất hủy.
9. POS bán hàng quầy + giả lập phần cứng Sunmi/iMin, in hoá đơn K57/K80, QR tra cứu.
10. Super Admin Billing: vòng đời store TRIAL→ACTIVE→GRACE→SUSPENDED, combo phần mềm+phần cứng 3 tháng, QR + webhook kích hoạt.

Tất cả phần "kết nối bên thứ 3" (E-Invoice, phần cứng POS, cổng thanh toán) đều **giả lập** theo PRD.

---

## Quyết định nền tảng

- Tạo bảng `stores` thật; mọi đơn/ca/kho/billing gắn `store_id`.
- Ngành hàng mặc định khi demo: **F&B (Cafe/Bánh)**.
- Triển khai **theo 4 giai đoạn**, build + kiểm thử rồi mới sang giai đoạn sau.

---

## GIAI ĐOẠN 1 — Multi-tenant, Multi-store & Ngành hàng động

**DB (migration):**

- `stores`: name, code, industry (enum `app_industry`: fnb|beverage|hotel|fashion), cashflow_mode (per_store|company), address, phone, is_active, + lifecycle billing fields (xem GĐ4).
- Thêm `store_id` (nullable) vào `orders`, `products` (gán cửa hàng/ngành) — không phá dữ liệu cũ.
- `app_settings` thêm key `active_industry`, `active_store` (mô phỏng cấp Admin).
- Bảng `product_variants`: product_id, attributes jsonb (động theo ngành), price_delta, stock, sku.
- GRANT + RLS đầy đủ cho mỗi bảng mới (staff quản trị, customer chỉ đọc sản phẩm active).

**Frontend:**

- Topbar/Settings thêm **bộ chọn Ngành hàng + Cửa hàng** (lưu app_settings, context toàn cục).
- `src/lib/industry.ts`: schema field động cho từng ngành (F&B: topping/mức đá; Thời trang: màu/size matrix; Khách sạn: loại giường/ngày đặt; Nước: quy cách thùng/chai).
- /products & /orders đọc industry để render field động.
- Trang quản trị Cửa hàng (`/stores`) CRUD store + chọn cashflow_mode.

## GIAI ĐOẠN 2 — Sản phẩm & Khuyến mãi nâng cao

**Products:**

- Khu Media (nhiều ảnh/video qua Lovable Cloud Storage bucket `product-media`).
- Cấu hình variants động theo ngành (ma trận màu/size cho thời trang, topping cho F&B...).
- Nút **Clone** sao chép sản phẩm + variants.

**Promos (DB + UI):**

- Mở rộng `promo_codes` / bảng mới `promotions`: type (flash_sale|happy_hour|combo|buy_x_get_y|tier_discount), khung giờ, danh sách sản phẩm combo, quy tắc X/Y, hạng áp dụng.
- /promos chia tab: Flash Sale/Happy Hour · Combo/Bundle · Quy tắc nâng cao.
- Logic tính giá đơn (orders) áp dụng promotion đang hiệu lực.

## GIAI ĐOẠN 3 — Dòng tiền, Chốt ca, Kho vận & POS

**Orders:**

- Chọn luồng tiền per_store/company (mặc định theo store).
- **E-Invoice adapter giả lập** (`einvoice.functions.ts`): nút xuất real-time từng đơn + nút "Gom xuất cuối ngày" cho đơn khách lẻ; bảng `einvoices` lưu trạng thái, provider Misa/Viettel.

**Chốt ca:** bảng `shifts` (store, staff, opening_cash, system_total, counted_cash, diff, reason, opened_at/closed_at). Trang `/shifts` mở/đóng ca, tính chênh lệch, bắt nhập lý do nếu lệch.

**Kho vận:** bảng `inventory_docs` + `inventory_items` (type: purchase|transfer|writeoff). Phiếu nhập tính **giá vốn bình quân gia quyền** (cập nhật `products.avg_cost`), điều chuyển giữa store, xuất hủy. Trang `/inventory` dạng tab.

**POS:** trang `/pos` bán hàng quầy: chọn sản phẩm + variant, thanh toán → preview hoá đơn **K57/K80** (tên NV, timeline, QR tra cứu, mã đơn), giả lập kết nối Sunmi/iMin + in không qua hộp thoại trình duyệt (render iframe/print CSS mô phỏng).

## GIAI ĐOẠN 4 — Super Admin Billing (SaaS + phần cứng)

- Vòng đời store: thêm fields `billing_status` (TRIAL|ACTIVE|GRACE_PERIOD|SUSPENDED), trial_ends_at, grace_ends_at, plan, hardware_combo.
- Trang `/billing` (chỉ owner): danh sách store, trạng thái, gia hạn, gói Combo phần mềm+phần cứng (thanh toán trước 3 tháng).
- Khi SUSPENDED: khoá màn hình store, chỉ hiện QR thanh toán.
- QR động + nội dung CK; route công khai `/api/public/billing-webhook` giả lập duyệt kích hoạt khi "quét mã thành công" (verify chữ ký).

---

## Ghi chú kỹ thuật

- Schema DB qua công cụ migration (GRANT + RLS + trigger updated_at cho mọi bảng mới).
- Server fn (`createServerFn` + `requireSupabaseAuth`) cho ghi ví/kho/ca/billing; webhook dùng server route `/api/public/*` có verify chữ ký.
- Field động lưu jsonb để không phải migrate khi đổi ngành.
- Mỗi giai đoạn: cập nhật sidebar, kiểm tra TypeScript build, QA luồng theo role.

Bắt đầu từ **Giai đoạn 1** sau khi bạn duyệt.

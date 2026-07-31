# RICGY — Cửa Hàng Thời Trang & Hệ Thống Quản Trị Doanh Số Đối Tác (OmniDashboard Hub)

Chào mừng bạn đến với **RICGY** – Giải pháp hợp nhất giữa cửa hàng bán lẻ đa kênh (Mobile-first Storefront) và hệ thống quản trị bán hàng, đại lý, cộng tác viên (Affiliate) và vận hành kho bãi tập trung (OmniDashboard Hub).

Dự án được xây dựng trên nền tảng **TanStack Start** hiện đại mang lại tốc độ tải trang cực nhanh, tối ưu hóa SEO và bảo mật dữ liệu cấp doanh nghiệp nhờ kết nối trực tiếp với **Supabase**.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

* **Framework**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (React 19 + SSR + Vite)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS Policies + Triggers)
* **Styling**: Vanilla CSS (tối ưu hóa tốc độ tải trang và giao diện tùy biến) + Tailwind CSS (cho các UI component)
* **Typography**: Playfair Display (Serif sang trọng cho tiêu đề thời trang) và Be Vietnam Pro (Sans-serif mượt mà, tối ưu hiển thị tiếng Việt 100%)
* **Deployment**: [Vercel](https://vercel.com/) (Serverless)

---

## ✨ Các Tính Năng Đã Hoàn Thành (Core Features)

### 1. Mobile-First Storefront (Giao diện mua sắm trên Điện thoại)
* Giao diện giả lập ứng dụng di động (Mobile App) ngay trên trình duyệt web với khung bo viền cao cấp, thanh điều hướng đáy (Bottom Navigation) chống tràn thông minh.
* Danh mục sản phẩm đa dạng tập trung vào: **Thời trang (Fashion)**, **Mỹ phẩm (Cosmetics)**, **Thực phẩm sạch (Foods)**.
* **Zalo Checkout**: Khách hàng chọn đồ, thêm vào giỏ hàng và gửi đơn hàng trực tiếp qua Zalo Chat của chủ shop cực kỳ tiện lợi.
* Hỗ trợ tìm kiếm sản phẩm thông minh và lọc danh mục nhanh chóng.

### 2. Màn Hình POS Bán Hàng Tại Quầy (Point of Sale)
* Màn hình POS tối giản, dễ thao tác dành cho Thu ngân (`cashier`) và Quản lý (`store_manager`).
* Quét chọn sản phẩm nhanh, áp mã giảm giá (Voucher), chọn hình thức thanh toán.
* Tự động in hóa đơn (Receipt Generator) tức thì ngay sau khi tạo đơn mà không cần đợi duyệt thanh toán.

### 3. Vận Hành Kho Bãi & Xuất Nhập Tồn (Inventory Management)
* Bảng theo dõi số lượng tồn kho thực tế của toàn bộ mã hàng (SKU) realtime.
* Tạo phiếu kiểm kho chuyên nghiệp:
  * **Nhập kho (Purchase)**: Tăng số lượng hàng tồn khi nhập từ nhà cung cấp.
  * **Xuất hủy (Writeoff)**: Xuất hủy hàng lỗi, hàng hết hạn và tự động trừ kho.
  * **Điều chuyển (Transfer)**: Chuyển hàng giữa các chi nhánh điểm bán.

### 4. Hệ Thống Hoa Hồng Affiliate & Đại Lý (Multi-tier Commission)
* Hỗ trợ gộp chung cả hai cơ chế: **Cộng tác viên (Affiliate - 1 cấp)** và **Đại lý 3 cấp (Agent Tiers)**.
* Cấu hình hoa hồng linh hoạt trên từng sản phẩm (tính theo phần trăm `%` hoặc số tiền cố định).
* Tự động cộng tiền hoa hồng vào **Ví điện tử** của đối tác giới thiệu khi đơn hàng được duyệt thanh toán thành công (`status = 'paid'`).
* Trang yêu cầu rút tiền (Withdrawals) cho đại lý/cộng tác viên kèm lịch sử giao dịch.

### 5. Quản Trị Phân Quyền (RBAC) & Người Dùng
* Hệ thống phân quyền chặt chẽ thông qua bảng `user_roles`:
  * **Super Admin / Owner**: Toàn quyền cấu hình hệ thống, xem báo cáo doanh thu, bật/tắt các tính năng.
  * **Store Manager**: Quản lý chi nhánh cửa hàng.
  * **Cashier**: Nhân viên bán hàng chỉ được vào POS, Chốt ca và xem Đơn hàng của mình.
* Trang quản lý người dùng tiện lợi giúp Admin đổi vai trò/phân quyền nhân viên qua Dropdown.

---

## 🛠️ Hướng Dẫn Cài Đặt Dưới Local

### Bước 1: Clone dự án và Cài đặt thư viện
```bash
# Di chuyển vào thư mục dự án
cd "OmniDashboard Hub"

# Cài đặt tất cả các dependencies cần thiết
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của dự án với nội dung như sau:
```env
SUPABASE_URL="https://mthrclykjdbcpolqpwhh.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_GOsE_7YzWdvLSML_BY_FbA_NjhpCbIE"
SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY_BÍ_MẬT_LẤY_TỪ_SUPABASE>"

VITE_SUPABASE_URL="https://mthrclykjdbcpolqpwhh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_GOsE_7YzWdvLSML_BY_FbA_NjhpCbIE"
VITE_SUPABASE_PROJECT_ID="mthrclykjdbcpolqpwhh"
```

### Bước 3: Đồng bộ Cơ sở dữ liệu (Supabase Migrations)
Để đẩy toàn bộ cấu hình bảng biểu, RLS và dữ liệu mẫu lên database Supabase của bạn:
```bash
npx supabase db push
```

### Bước 4: Khởi chạy Development Server
Dự án được cấu hình chạy mặc định trên cổng `8085` để tránh xung đột với các ứng dụng khác:
```bash
npm run dev -- --port 8085
```
* **Storefront (Mua hàng)**: Truy cập tại [http://localhost:8085/](http://localhost:8085/)
* **Admin Dashboard (Quản trị)**: Truy cập tại [http://localhost:8085/dashboard](http://localhost:8085/dashboard) hoặc [http://localhost:8085/login](http://localhost:8085/login)

---

## 🌐 Hướng Dẫn Deploy Lên Vercel

Khi deploy dự án lên Vercel, bạn cần cấu hình đầy đủ các biến môi trường trong **Vercel Settings -> Environment Variables** tương ứng với các biến trong file `.env`:

* **`SUPABASE_URL`**
* **`SUPABASE_PUBLISHABLE_KEY`**
* **`SUPABASE_SERVICE_ROLE_KEY`** *(Vô cùng quan trọng cho Backend Server Functions)*
* **`VITE_SUPABASE_URL`**
* **`VITE_SUPABASE_PUBLISHABLE_KEY`**

Sau khi cấu hình, chỉ cần bấm **Deploy** là toàn bộ trang web thực tế sẽ tự động liên kết với Supabase.

---

## 🔒 Tài Khoản Super Admin Mặc Định (Cố Định)
Để thuận tiện cho bạn kiểm thử toàn bộ hệ thống mà không lo bị khóa quyền, tài khoản sau đây đã được định nghĩa vĩnh viễn là **Super Admin / Owner tối cao** trong mã nguồn và cơ sở dữ liệu:
* **Email**: `nguyen862786@gmail.com`
* **Mật khẩu mặc định**: `Ndquang7777#`

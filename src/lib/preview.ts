// Dev-Mode Bypass Auth — luôn BẬT để truy cập thẳng không bị đá về trang đăng nhập.
// Đặt VITE_PREVIEW_BYPASS="false" nếu muốn tắt hoàn toàn về sau.
export const PREVIEW_ENABLED = import.meta.env.VITE_PREVIEW_BYPASS !== "false";

/** localStorage key cho client-side dev bypass (chỉ active khi PREVIEW_ENABLED). */
export const DEV_BYPASS_KEY = "dev_preview_bypass";

/**
 * Khi BẬT, Dev-Mode tự kích hoạt cho MỌI lượt truy cập (không cần bấm nút,
 * không cần đăng nhập) — phù hợp để test toàn bộ luồng. Người dùng vẫn có thể
 * "Thoát" để dùng đăng nhập thật (ghi cờ tắt vào localStorage).
 */
export const DEV_BYPASS_OFF_KEY = "dev_preview_bypass_off";
export const DEV_AUTO_BYPASS = PREVIEW_ENABLED;

/**
 * FORCE Dev-Mode: bỏ qua cờ "Thoát" (off key) để công tắc luôn BẬT và không
 * bao giờ bị kẹt ở trạng thái tắt. Khi bật, bypass được kích hoạt cho mọi
 * lượt truy cập bất kể localStorage trước đó.
 */
export const DEV_FORCE_BYPASS = PREVIEW_ENABLED;

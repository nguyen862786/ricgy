import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { User, Shield, CreditCard, MapPin, Phone, LogOut, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  component: UserProfileTab,
});

function UserProfileTab() {
  const { session, signOut } = useAuth();
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email || "";
  const name = session?.user?.user_metadata?.full_name || userEmail.split("@")[0] || "Khách hàng";

  return (
    <div className="px-4 pb-12 space-y-6">
      {/* Profile Header */}
      <div className="pt-2 flex items-center gap-4">
        <div className="size-16 rounded-full bg-linear-to-tr from-[var(--fuchsia-pop)] to-orange-400 flex items-center justify-center text-white font-serif text-3xl font-bold border-2 border-white shadow-md">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">{name}</h2>
          <p className="text-xs text-muted-foreground">
            {isLoggedIn ? userEmail : "Chưa đăng nhập hệ thống"}
          </p>
        </div>
      </div>

      {/* Admin Quick Switch (If Logged In) */}
      {isLoggedIn && (
        <div className="bg-linear-to-r from-teal-900 to-primary text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Quyền hạn truy cập</p>
              <p className="text-[10px] text-white/80">Đối tác / Quản trị viên</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-bold bg-white text-primary px-3 py-1.5 rounded-full hover:bg-neutral-100 transition flex items-center gap-0.5"
          >
            Dashboard <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

      {/* Shop features options */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-xs">
        <div className="p-4 flex items-center justify-between hover:bg-secondary/15 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <CreditCard className="size-4.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Đơn hàng của tôi</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </div>
        <div className="p-4 flex items-center justify-between hover:bg-secondary/15 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <MapPin className="size-4.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Địa chỉ giao hàng</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </div>
        <div className="p-4 flex items-center justify-between hover:bg-secondary/15 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <Phone className="size-4.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Hỗ trợ khách hàng Zalo</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Partner Area (Admin Dashboard trigger) */}
      <div className="bg-secondary/40 border border-border rounded-3xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Award className="size-6 text-[var(--fuchsia-pop)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-foreground">
              Đăng nhập Đối tác & Đại lý
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn là đối tác liên kết hoặc đại lý phân phối doanh số? Đăng nhập vào nền tảng quản trị kinh doanh để kiểm tra báo cáo và doanh thu.
            </p>
          </div>
        </div>

        <Button className="w-full bg-foreground text-background hover:bg-[var(--fuchsia-pop)] hover:text-white rounded-xl py-3 font-semibold text-xs transition cursor-pointer" asChild>
          <Link to="/login">Đến Cổng Quản Trị Đối Tác</Link>
        </Button>
      </div>

      {/* Logout button */}
      {isLoggedIn && (
        <button
          onClick={() => signOut().then(() => window.location.reload())}
          className="w-full py-3.5 border border-destructive/20 text-destructive text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-destructive/5 transition cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>Đăng xuất tài khoản</span>
        </button>
      )}
    </div>
  );
}

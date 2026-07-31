import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ACCESS_GROUP_LABEL } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

/**
 * Chặn truy cập route theo nhóm quyền của tài khoản hiện tại.
 * Nếu không có quyền -> hiện màn hình "Không có quyền" + lối về trang mặc định.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { canAccess, group, defaultRoute } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (canAccess(pathname)) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Tài khoản <strong>{ACCESS_GROUP_LABEL[group]}</strong> của bạn không được phép mở trang
          này. Vui lòng liên hệ Chủ doanh nghiệp nếu cần mở thêm quyền.
        </p>
      </div>
      <Button asChild>
        <Link to={defaultRoute}>Về trang được phép</Link>
      </Button>
    </div>
  );
}

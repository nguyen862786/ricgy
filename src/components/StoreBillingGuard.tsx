import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAppConfig } from "@/hooks/useAppConfig";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

// Khóa màn hình khi cửa hàng đang chọn bị SUSPENDED (chỉ owner thấy lối thanh toán)
export function StoreBillingGuard({ children }: { children: ReactNode }) {
  const { store } = useAppConfig();
  const { group } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // luôn cho phép vào trang Billing để thanh toán
  const suspended = store?.billing_status === "suspended" && pathname !== "/billing";
  if (!suspended) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <Lock className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Cửa hàng đã bị khóa</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thuê bao của <b>{store?.name}</b> đã hết hạn. Vui lòng thanh toán để tiếp tục sử dụng.
        </p>
        {group === "super_admin" ? (
          <Button asChild className="mt-4">
            <Link to="/billing">Thanh toán / Gia hạn ngay</Link>
          </Button>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Liên hệ chủ hệ thống để gia hạn.</p>
        )}
      </Card>
    </div>
  );
}

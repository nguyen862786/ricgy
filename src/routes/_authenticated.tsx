import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppConfigProvider } from "@/hooks/useAppConfig";
import { TenantModulesProvider } from "@/hooks/useTenantModules";
import { StoreIndustrySwitcher } from "@/components/StoreIndustrySwitcher";
import { StoreBillingGuard } from "@/components/StoreBillingGuard";
import { RouteGuard } from "@/components/RouteGuard";
import { PREVIEW_EMAIL } from "@/lib/preview-auth.functions";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading, signOut, previewEnabled, devMode, setDevMode } = useAuth();
  const navigate = useNavigate();
  const bypass = session?.user?.email === PREVIEW_EMAIL;

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <AppConfigProvider>
      <TenantModulesProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-muted/20">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
                <SidebarTrigger />
                <div className="flex-1" />
                {previewEnabled && (
                  <label className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <span>Dev Mode</span>
                    <Switch
                      checked={devMode}
                      onCheckedChange={(v) => setDevMode(v)}
                      aria-label="Bật/tắt Dev Mode bypass đăng nhập"
                    />
                  </label>
                )}
                {bypass && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                      Xem trước
                    </span>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={async () => {
                        await signOut();
                        window.location.href = "/";
                      }}
                    >
                      Thoát
                    </button>
                  </div>
                )}
                <StoreIndustrySwitcher />
              </header>
              <main className="flex-1 p-4 md:p-6">
                <StoreBillingGuard>
                  <RouteGuard>
                    <Outlet />
                  </RouteGuard>
                </StoreBillingGuard>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TenantModulesProvider>
    </AppConfigProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { CampaignPopup } from "@/components/CampaignPopup";
import { CartProvider } from "@/hooks/useCart";
import { MobileAppLayout } from "@/components/site/MobileAppLayout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RICGY — Thời trang, Mỹ phẩm & Quản trị Doanh số" },
      {
        name: "description",
        content:
          "RICGY energetic — Cửa hàng thời trang, mỹ phẩm, thực phẩm sạch và Hệ thống quản lý doanh số đối tác, đại lý kinh doanh.",
      },
      { name: "author", content: "RICGY" },
      { property: "og:title", content: "RICGY — Thời trang, Mỹ phẩm & Quản trị Doanh số" },
      {
        property: "og:description",
        content:
          "RICGY energetic — Cửa hàng thời trang, mỹ phẩm, thực phẩm sạch và Hệ thống quản lý doanh số đối tác, đại lý kinh doanh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RICGY — Thời trang, Mỹ phẩm & Quản trị Doanh số" },
      {
        name: "twitter:description",
        content:
          "RICGY energetic — Cửa hàng thời trang, mỹ phẩm, thực phẩm sạch và Hệ thống quản lý doanh số đối tác, đại lý kinh doanh.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();

  const storefrontPaths = [
    "/",
    "/danh-muc",
    "/tim-kiem",
    "/gio-hang",
    "/profile",
    "/cong-so",
    "/the-thao",
    "/dam-di-choi",
    "/dam-ngu",
    "/my-pham",
    "/thuc-pham",
    "/ve-chung-toi",
    "/lien-he",
    "/lookbook",
    "/douyin",
    "/huong-dan-size",
  ];

  const isStorefront =
    storefrontPaths.includes(location.pathname) ||
    location.pathname.startsWith("/san-pham");

  const isDashboard = !isStorefront;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          {isDashboard ? (
            <Outlet />
          ) : (
            <MobileAppLayout>
              <Outlet />
            </MobileAppLayout>
          )}
          <Toaster richColors position="top-right" />
          <CampaignPopup />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

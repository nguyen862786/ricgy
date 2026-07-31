import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PREVIEW_ENABLED, DEV_BYPASS_KEY } from "@/lib/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading, defaultRoute } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && !authLoading) navigate({ to: defaultRoute });
  }, [session, authLoading, defaultRoute, navigate]);

  function enterPreview() {
    try {
      localStorage.setItem(DEV_BYPASS_KEY, "1");
    } catch (e) {
      console.error("LocalStorage Error:", e);
    }
    window.location.href = "/dashboard";
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error("Đăng nhập thất bại", { description: error.message });
    else toast.success("Đăng nhập thành công");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let referrerId: string | null = null;
    try {
      const r = localStorage.getItem("ref_id");
      if (r && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r)) {
        referrerId = r;
      }
    } catch (error) {
      console.error("LocalStorage Error:", error);
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email, ...(referrerId ? { referrer_id: referrerId } : {}) },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) toast.error("Đăng ký thất bại", { description: error.message });
    else {
      toast.success("Đăng ký thành công", { description: "Bạn đã có thể đăng nhập." });
      try {
        localStorage.removeItem("ref_id");
        localStorage.removeItem("ref_at");
      } catch (error) {
        console.error("LocalStorage Error:", error);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Core Admin Dashboard</CardTitle>
          <CardDescription>Hệ điều hành quản trị SaaS đa kênh</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đăng nhập
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ tên</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Mật khẩu</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tạo tài khoản
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Người dùng đầu tiên đăng ký sẽ tự động trở thành <strong>Owner</strong>.
                </p>
              </form>
            </TabsContent>
          </Tabs>
          {PREVIEW_ENABLED && (
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={enterPreview}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}⏩ Vào thẳng xem trước
                (Admin)
              </Button>
            </div>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              ← Quay lại trang chủ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

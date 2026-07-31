import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyManagerApproval } from "@/lib/approval.functions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onApproved: (approver: string) => void;
  title?: string;
  description?: string;
}

/**
 * Hộp thoại yêu cầu Quản lý cửa hàng / Chủ doanh nghiệp nhập mật khẩu để phê
 * duyệt một thao tác nhạy cảm (Hủy đơn, Hoàn tiền, Đổi trả...).
 */
export function ManagerApprovalDialog({ open, onClose, onApproved, title, description }: Props) {
  const verify = useServerFn(verifyManagerApproval);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verify({ data: { email, password } });
      if (!res.approved) {
        toast.error("Phê duyệt thất bại", { description: res.reason });
        return;
      }
      toast.success("Đã phê duyệt", { description: `Bởi ${res.approver}` });
      setEmail("");
      setPassword("");
      onApproved(res.approver);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Lỗi phê duyệt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title ?? "Cần phê duyệt của Quản lý"}
          </DialogTitle>
          <DialogDescription>
            {description ??
              "Thao tác này yêu cầu Quản lý cửa hàng hoặc Chủ doanh nghiệp nhập mật khẩu để phê duyệt."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="approver-email">Email người phê duyệt</Label>
            <Input
              id="approver-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="approver-pw">Mật khẩu</Label>
            <Input
              id="approver-pw"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Phê duyệt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vnd, dt } from "@/lib/format";
import { listUsers, setUserRole } from "@/lib/users.functions";
import { isSystemSuperAdmin } from "@/lib/system-admins";
import { Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

const ROLES = [
  "super_admin",
  "owner",
  "admin",
  "store_manager",
  "cashier",
  "agent",
  "affiliate",
  "customer",
] as const;

function UsersPage() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const updateRole = useServerFn(setUserRole);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
  });

  if (!isStaff) return <div className="text-muted-foreground">Không có quyền.</div>;

  async function changeRole(userId: string, role: string, action: "add" | "remove") {
    try {
      await updateRole({ data: { userId, role: role as any, action } });
      toast.success("Đã cập nhật vai trò");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Người dùng</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Tổng chi</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-64">Cấp vai trò</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {users.map((u: any) => (
              <UserRow key={u.id} user={u} onChange={changeRole} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function UserRow({
  user,
  onChange,
}: {
  user: any;
  onChange: (id: string, role: string, action: "add" | "remove") => void;
}) {
  const [pick, setPick] = useState<string>("");
  // Tài khoản super-admin khóa cứng — không cho chỉnh sửa / xóa vai trò.
  const locked = isSystemSuperAdmin(user.email);
  return (
    <TableRow>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1.5">
          {user.email}
          {locked && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
              title="Tài khoản Super Admin khóa cứng — không thể chỉnh sửa hoặc xóa vai trò"
            >
              <Lock className="h-3 w-3" /> Khóa cứng
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{user.full_name ?? "—"}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          {user.roles.map((r: string) =>
            locked ? (
              <Badge
                key={r}
                variant="secondary"
                className="cursor-not-allowed gap-1 opacity-90"
                title="Vai trò của tài khoản khóa cứng không thể bị gỡ"
                onClick={() =>
                  toast.error("Tài khoản Super Admin khóa cứng", {
                    description: "Không thể chỉnh sửa hoặc xóa vai trò của tài khoản này.",
                    icon: <ShieldAlert className="h-4 w-4" />,
                  })
                }
              >
                {r} <Lock className="h-3 w-3" />
              </Badge>
            ) : (
              <Badge
                key={r}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onChange(user.id, r, "remove")}
                title="Click để gỡ"
              >
                {r} ×
              </Badge>
            ),
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">{vnd(user.total_spent)}</TableCell>
      <TableCell className="text-sm">{dt(user.created_at)}</TableCell>
      <TableCell>
        {locked ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Đã khóa
          </span>
        ) : (
          <div className="flex gap-1">
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.filter((r) => !user.roles.includes(r)).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!pick}
              onClick={() => {
                onChange(user.id, pick, "add");
                setPick("");
              }}
            >
              +
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

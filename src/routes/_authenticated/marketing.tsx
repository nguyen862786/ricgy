import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  listCampaigns,
  upsertCampaign,
  deleteCampaign,
  getMarketingReport,
} from "@/lib/marketing.functions";
import { Megaphone, Plus, Trash2, BarChart3, Trophy, Tag as TagIcon, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketing")({
  component: MarketingPage,
});

const SEGMENTS = [
  { value: "all", label: "Tất cả khách" },
  { value: "new", label: "Khách mới (30 ngày)" },
  { value: "no_purchase", label: "Chưa mua hàng" },
  { value: "vip", label: "VIP (Gold/Diamond)" },
  { value: "inactive", label: "Không hoạt động (>90 ngày)" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  active: "Đang chạy",
  ended: "Kết thúc",
};

const STATUS_VARIANT: Record<string, any> = {
  draft: "secondary",
  active: "default",
  ended: "outline",
};

function MarketingPage() {
  const { isStaff } = useAuth();
  if (!isStaff) return <div className="text-muted-foreground">Không có quyền.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Megaphone className="h-6 w-6" /> Marketing & Truyền thông
      </h1>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Chiến dịch</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CampaignsTab() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listCampaigns);
  const save = useServerFn(upsertCampaign);
  const remove = useServerFn(deleteCampaign);
  const [editing, setEditing] = useState<any>(null);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchList(),
  });

  function blank() {
    return {
      name: "",
      description: "",
      segment: "all",
      tier_filter: "",
      tag_filter: "",
      promo_code: "",
      starts_at: "",
      ends_at: "",
      status: "draft",
      popup_enabled: false,
      popup_title: "",
      popup_body: "",
      popup_image_url: "",
      popup_cta_text: "",
      popup_cta_url: "",
      popup_dismiss_hours: 24,
    };
  }

  async function submit() {
    if (!editing?.name) return toast.error("Cần tên chiến dịch");
    try {
      const payload: any = { ...editing };
      [
        "description",
        "tier_filter",
        "tag_filter",
        "promo_code",
        "starts_at",
        "ends_at",
        "popup_title",
        "popup_body",
        "popup_image_url",
        "popup_cta_text",
        "popup_cta_url",
      ].forEach((k) => {
        if (!payload[k]) payload[k] = null;
      });
      payload.popup_dismiss_hours = Number(payload.popup_dismiss_hours) || 24;
      await save({ data: payload });
      toast.success("Đã lưu chiến dịch");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function del(id: string) {
    if (!confirm("Xoá chiến dịch?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setEditing(blank())}>
          <Plus className="mr-2 h-4 w-4" /> Tạo chiến dịch
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Phân khúc</TableHead>
              <TableHead>Mã KM</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có chiến dịch
                </TableCell>
              </TableRow>
            )}
            {campaigns.map((c: any) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() =>
                  setEditing({
                    ...c,
                    starts_at: c.starts_at?.slice(0, 10) || "",
                    ends_at: c.ends_at?.slice(0, 10) || "",
                  })
                }
              >
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {c.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {SEGMENTS.find((s) => s.value === c.segment)?.label || c.segment}
                  {c.tier_filter && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      Hạng: {c.tier_filter}
                    </Badge>
                  )}
                  {c.tag_filter && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      #{c.tag_filter}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {c.promo_code ? <Badge variant="secondary">{c.promo_code}</Badge> : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.starts_at ? dt(c.starts_at) : "—"} → {c.ends_at ? dt(c.ends_at) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => del(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Sửa chiến dịch" : "Tạo chiến dịch"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <Label>Tên *</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  rows={2}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phân khúc</Label>
                  <Select
                    value={editing.segment}
                    onValueChange={(v) => setEditing({ ...editing, segment: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <Select
                    value={editing.status}
                    onValueChange={(v) => setEditing({ ...editing, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Nháp</SelectItem>
                      <SelectItem value="active">Đang chạy</SelectItem>
                      <SelectItem value="ended">Kết thúc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Lọc theo hạng</Label>
                  <Input
                    placeholder="Gold, Silver..."
                    value={editing.tier_filter || ""}
                    onChange={(e) => setEditing({ ...editing, tier_filter: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Lọc theo tag</Label>
                  <Input
                    placeholder="vip, sinh-nhat..."
                    value={editing.tag_filter || ""}
                    onChange={(e) => setEditing({ ...editing, tag_filter: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Mã khuyến mãi đính kèm</Label>
                <Input
                  placeholder="WELCOME10"
                  value={editing.promo_code || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, promo_code: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bắt đầu</Label>
                  <Input
                    type="date"
                    value={editing.starts_at || ""}
                    onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Kết thúc</Label>
                  <Input
                    type="date"
                    value={editing.ends_at || ""}
                    onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-3 mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Popup hiển thị cho khách</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={!!editing.popup_enabled}
                      onChange={(e) => setEditing({ ...editing, popup_enabled: e.target.checked })}
                    />
                    Bật popup
                  </label>
                </div>
                {editing.popup_enabled && (
                  <>
                    <div>
                      <Label>Tiêu đề popup</Label>
                      <Input
                        value={editing.popup_title || ""}
                        onChange={(e) => setEditing({ ...editing, popup_title: e.target.value })}
                        placeholder="Mặc định: tên chiến dịch"
                      />
                    </div>
                    <div>
                      <Label>Nội dung</Label>
                      <Textarea
                        rows={3}
                        value={editing.popup_body || ""}
                        onChange={(e) => setEditing({ ...editing, popup_body: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Ảnh (URL)</Label>
                      <Input
                        value={editing.popup_image_url || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, popup_image_url: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nút CTA</Label>
                        <Input
                          value={editing.popup_cta_text || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, popup_cta_text: e.target.value })
                          }
                          placeholder="Khám phá ngay"
                        />
                      </div>
                      <div>
                        <Label>Link CTA</Label>
                        <Input
                          value={editing.popup_cta_url || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, popup_cta_url: e.target.value })
                          }
                          placeholder="/products hoặc https://..."
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Không hiện lại trong (giờ)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editing.popup_dismiss_hours ?? 24}
                        onChange={(e) =>
                          setEditing({ ...editing, popup_dismiss_hours: e.target.value })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Popup chỉ hiện khi chiến dịch ở trạng thái "Đang chạy" và trong khoảng thời
                      gian đã đặt.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button onClick={submit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsTab() {
  const fetchReport = useServerFn(getMarketingReport);
  const { data, isLoading } = useQuery({
    queryKey: ["marketing-report"],
    queryFn: () => fetchReport(),
  });

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TagIcon className="h-4 w-4" /> Top mã khuyến mãi
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead className="text-right">Lượt</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
              <TableHead className="text-right">Giảm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topPromos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {data.topPromos.map((p: any) => (
              <TableRow key={p.code}>
                <TableCell>
                  <Badge variant="secondary">{p.code}</Badge>
                </TableCell>
                <TableCell className="text-right">{p.uses}</TableCell>
                <TableCell className="text-right font-medium">{vnd(p.revenue)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  -{vnd(p.discount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Hiệu quả chiến dịch
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chiến dịch</TableHead>
              <TableHead className="text-right">Lượt</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.campaignPerf.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                  Chưa có chiến dịch
                </TableCell>
              </TableRow>
            )}
            {data.campaignPerf.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium text-sm">{c.name}</div>
                  {c.promo_code && (
                    <div className="text-xs text-muted-foreground">{c.promo_code}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">{c.uses}</TableCell>
                <TableCell className="text-right font-medium">{vnd(c.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Top Affiliate / Đại lý
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người giới thiệu</TableHead>
              <TableHead className="text-right">Đơn</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topAffiliates.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {data.topAffiliates.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="font-medium text-sm">{a.profile?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{a.profile?.email}</div>
                </TableCell>
                <TableCell className="text-right">{a.orders}</TableCell>
                <TableCell className="text-right font-medium">{vnd(a.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Top Khách hàng
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách</TableHead>
              <TableHead className="text-right">Đơn</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {data.topCustomers.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium text-sm">{c.profile?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.profile?.email}</div>
                </TableCell>
                <TableCell className="text-right">{c.orders}</TableCell>
                <TableCell className="text-right font-medium">{vnd(c.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

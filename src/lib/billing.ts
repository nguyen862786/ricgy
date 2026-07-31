// Hằng số gói dịch vụ (client-safe) cho SaaS billing
export type PlanKey = "starter" | "pro" | "combo";

export const BILLING_PLANS: Record<
  PlanKey,
  {
    label: string;
    monthly: number; // giá phần mềm / tháng
    hardware: boolean; // có kèm phần cứng không
    fixedMonths?: number; // combo trả trước cố định
    desc: string;
  }
> = {
  starter: {
    label: "Gói Cơ bản",
    monthly: 200_000,
    hardware: false,
    desc: "Phần mềm bán hàng cơ bản",
  },
  pro: {
    label: "Gói Pro",
    monthly: 400_000,
    hardware: false,
    desc: "Đầy đủ tính năng + báo cáo nâng cao",
  },
  combo: {
    label: "Combo PM + Phần cứng",
    monthly: 500_000,
    hardware: true,
    fixedMonths: 3,
    desc: "Trả trước 3 tháng, tặng máy POS Sunmi/iMin",
  },
};

export function planMonths(plan: PlanKey, months: number): number {
  return BILLING_PLANS[plan].fixedMonths ?? months;
}

export function planAmount(plan: PlanKey, months: number): number {
  return BILLING_PLANS[plan].monthly * planMonths(plan, months);
}

export const BILLING_STATUS_LABEL: Record<string, string> = {
  trial: "Dùng thử",
  active: "Đang hoạt động",
  grace_period: "Nhắc nợ",
  suspended: "Đã khóa",
};
export const BILLING_STATUS_COLOR: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  trial: "secondary",
  active: "default",
  grace_period: "outline",
  suspended: "destructive",
};

export function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

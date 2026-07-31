export function vnd(n: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));
}

export function num(n: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(n ?? 0));
}

export function dt(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleString("vi-VN");
}

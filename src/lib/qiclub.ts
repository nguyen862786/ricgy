// Shared (client + server safe) helpers for the QiClub voucher ecosystem.

export interface QiClubConfig {
  enabled: boolean;
  webhook_url: string;
  secret_key: string;
  default_prefix: string;
}

export const DEFAULT_QICLUB_CONFIG: QiClubConfig = {
  enabled: false,
  webhook_url: "",
  secret_key: "",
  default_prefix: "QIC",
};

export interface SubsidySplit {
  qiclub: number;
  company: number;
  store: number;
}

/**
 * Splits a voucher amount between QiClub, the parent company and the store
 * according to configured percentage ratios. Ratios are normalised by their
 * sum so the three parts always add up exactly to `amount` (rounding remainder
 * goes to the store). If no ratio is set, the store bears the full cost.
 */
export function splitSubsidy(
  amount: number,
  qiclubRatio: number,
  companyRatio: number,
  storeRatio: number,
): SubsidySplit {
  const total = (qiclubRatio || 0) + (companyRatio || 0) + (storeRatio || 0);
  if (amount <= 0) return { qiclub: 0, company: 0, store: 0 };
  if (total <= 0) return { qiclub: 0, company: 0, store: Math.round(amount) };
  const qiclub = Math.round((amount * (qiclubRatio || 0)) / total);
  const company = Math.round((amount * (companyRatio || 0)) / total);
  const store = Math.round(amount) - qiclub - company;
  return { qiclub, company, store };
}

/** A code belongs to the QiClub ecosystem when it matches a synced campaign prefix. */
export function matchesPrefix(code: string, prefix: string | null | undefined): boolean {
  const c = code.trim().toUpperCase();
  if (!c) return false;
  const p = (prefix ?? "").trim().toUpperCase();
  if (!p) return false;
  return c.startsWith(p);
}

export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return "";
  if (secret.length <= 6) return "••••";
  return secret.slice(0, 3) + "••••" + secret.slice(-3);
}

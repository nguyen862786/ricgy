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
  default_prefix: "QI",
};

export function splitSubsidy(discount: number, qiclubPct: number, companyPct: number, storePct: number) {
  return {
    qiclub: Math.round((discount * qiclubPct) / 100),
    company: Math.round((discount * companyPct) / 100),
    store: Math.round((discount * storePct) / 100),
  };
}

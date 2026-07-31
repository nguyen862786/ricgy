import { useAppConfig } from "@/hooks/useAppConfig";
import { INDUSTRY_LIST, industryOf } from "@/lib/industry";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store } from "lucide-react";

export function StoreIndustrySwitcher() {
  const { industry, setIndustry, storeId, setStoreId, stores, store } = useAppConfig();

  return (
    <div className="flex items-center gap-2">
      {stores.length > 0 && (
        <Select value={storeId ?? undefined} onValueChange={(v) => setStoreId(v)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <Store className="mr-1 h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Chọn cửa hàng" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select value={industry} onValueChange={(v) => setIndustry(v as any)} disabled={!!store}>
        <SelectTrigger
          className="h-8 w-[170px] text-xs"
          title={store ? "Ngành lấy theo cửa hàng đang chọn" : "Mô phỏng ngành hàng"}
        >
          <SelectValue>
            <span>
              {industryOf(industry).emoji} {industryOf(industry).label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {INDUSTRY_LIST.map((i) => (
            <SelectItem key={i.key} value={i.key}>
              {i.emoji} {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

import { vnd, dt } from "@/lib/format";

export type ReceiptData = {
  code: string;
  storeName: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  staffEmail?: string | null;
  createdAt: string;
  items: { name: string; qty: number; unit_price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  lookupUrl: string;
};

// Hoá đơn nhiệt K57 (58mm) hoặc K80 (80mm) — giả lập máy in Sunmi/iMin
export function ReceiptPreview({ data, paper }: { data: ReceiptData; paper: "k57" | "k80" }) {
  const width = paper === "k57" ? 220 : 300;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.lookupUrl)}`;
  return (
    <div
      id="receipt-print"
      className="mx-auto bg-white text-black"
      style={{
        width,
        fontFamily: "'Courier New', monospace",
        padding: 12,
        fontSize: paper === "k57" ? 11 : 12,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: paper === "k57" ? 13 : 15 }}>{data.storeName}</div>
        {data.storeAddress && <div>{data.storeAddress}</div>}
        {data.storePhone && <div>ĐT: {data.storePhone}</div>}
      </div>
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center", fontWeight: 700 }}>HOÁ ĐƠN BÁN HÀNG</div>
      <div>Mã đơn: {data.code}</div>
      <div>Ngày: {dt(data.createdAt)}</div>
      {data.staffEmail && <div>NV: {data.staffEmail}</div>}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      {data.items.map((it, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div>{it.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {it.qty} x {vnd(it.unit_price)}
            </span>
            <span>{vnd(it.qty * it.unit_price)}</span>
          </div>
        </div>
      ))}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <Row label="Tạm tính" value={vnd(data.subtotal)} />
      {data.discount > 0 && <Row label="Giảm giá" value={"-" + vnd(data.discount)} />}
      <Row label="TỔNG" value={vnd(data.total)} bold />
      <Row label="Thanh toán" value={data.paymentMethod} />
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center" }}>
        <img src={qr} alt="QR tra cứu" width={120} height={120} style={{ margin: "0 auto" }} />
        <div style={{ fontSize: 10, marginTop: 4 }}>Quét mã để tra cứu đơn</div>
        <div style={{ marginTop: 6 }}>Cảm ơn quý khách!</div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

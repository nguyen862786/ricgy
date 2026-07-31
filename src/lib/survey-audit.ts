// ============================================================================
// Dữ liệu kịch bản phễu khảo sát chẩn đoán + ma trận 8 khối siêu module.
// Dùng cho trang công khai /survey-audit (Qi Holding).
// ============================================================================

export type ModuleKey =
  | "store"
  | "voucher"
  | "hrm"
  | "pos"
  | "affiliate"
  | "service"
  | "hotel"
  | "finance";

export interface SurveyOption {
  id: string;
  label: string;
  /** Các khối giải pháp sẽ được mở khoá khi chọn đáp án này. */
  unlocks: ModuleKey[];
}

export interface SurveyStep {
  id: "business_model" | "ops_pains" | "marketing_pains" | "expectations" | "barrier";
  step: number;
  badge: string;
  title: string;
  question: string;
  multi: boolean;
  options: SurveyOption[];
}

export const SURVEY_STEPS: SurveyStep[] = [
  {
    id: "business_model",
    step: 1,
    badge: "Bước 1 · Hiện trạng",
    title: "Khảo sát thực tại & Ngành nghề vận hành",
    question: "Mô hình kinh doanh hiện tại của Doanh nghiệp thuộc phân khúc nào?",
    multi: false,
    options: [
      {
        id: "retail",
        label:
          "Chuỗi Sản xuất & Phân phối Sản phẩm đóng gói, F&B, Thực phẩm chay, Trà đóng lon, Thiết bị bán hàng tự động (Vending).",
        unlocks: ["store", "pos", "voucher"],
      },
      {
        id: "beauty",
        label: "Chuỗi Thẩm mỹ viện, Spa, Salon làm đẹp, Clinic, Phòng khám chuyên khoa.",
        unlocks: ["service", "hrm", "voucher"],
      },
      {
        id: "stay",
        label: "Chuỗi cơ sở Lưu trú / Khách sạn / Farmstay / Khu nghỉ dưỡng sinh thái.",
        unlocks: ["hotel", "hrm", "finance"],
      },
      {
        id: "factory",
        label: "Xưởng sản xuất sỉ phân phối qua hệ thống Đại lý & Kho vệ tinh chặng cuối.",
        unlocks: ["store", "affiliate", "finance"],
      },
      {
        id: "holding",
        label: "Mô hình Doanh chủ điều hành đa hệ sinh thái con (Solobiz / Holding).",
        unlocks: ["finance", "affiliate", "store"],
      },
    ],
  },
  {
    id: "ops_pains",
    step: 2,
    badge: "Bước 2 · Vận hành",
    title: "Bóc tách Nỗi đau Quản trị Vận hành & Điểm bán",
    question:
      "Đâu là trở ngại lớn nhất khiến Ban lãnh đạo mất ngủ trong quản lý các điểm bán và nhân sự hàng ngày?",
    multi: true,
    options: [
      {
        id: "flow",
        label:
          "Mất cân đối dòng chảy hàng hóa: số liệu phân phối từ kho tổng xuống điểm bán/vending sai lệch; doanh số cuối ngày mập mờ.",
        unlocks: ["store"],
      },
      {
        id: "supply",
        label:
          "Đứt gãy cung ứng: không kiểm soát tồn realtime; thực phẩm, nông sản, mỹ phẩm cận date / quá HSD gây thiệt hại lớn.",
        unlocks: ["store"],
      },
      {
        id: "credit",
        label:
          "Khủng hoảng kiểm soát công nợ đại lý gối đầu, thất thoát do quy trình thu hồi/hủy hàng cận date thủ công, và áp lực xuất hóa đơn điện tử thủ công cho từng điểm lẻ.",
        unlocks: ["finance", "store"],
      },
      {
        id: "hr",
        label:
          "Khủng hoảng chấm công & nhân sự: ca trực 24/7 chấm công lỏng lẻo; không đo được hiệu suất từng nhân viên.",
        unlocks: ["hrm"],
      },
      {
        id: "fragmented",
        label:
          "Hỗn loạn ứng dụng: quá nhiều app rời rạc làm dữ liệu phân mảnh, báo cáo tài chính mất nhiều ngày mới gom xong.",
        unlocks: ["finance"],
      },
    ],
  },
  {
    id: "marketing_pains",
    step: 3,
    badge: "Bước 3 · Tăng trưởng",
    title: 'Nỗi đau Marketing "mù quáng" & gánh nặng đội ngũ Sales',
    question:
      "Đâu là thực trạng nhức nhối nhất khi doanh nghiệp tìm cách bùng nổ doanh số và mở rộng kênh phân phối?",
    multi: true,
    options: [
      {
        id: "booking",
        label:
          "Đốt tiền Booking mù quáng: thuê KOL/KOC nhưng không biết chính xác bao nhiêu đơn thực tế đổ về từ ai.",
        unlocks: ["affiliate"],
      },
      {
        id: "agency",
        label:
          "Bế tắc kênh Đại lý: khó tìm kiếm, kết nối, duy trì động lực; tính hoa hồng thủ công dễ sai sót gây tranh chấp.",
        unlocks: ["affiliate"],
      },
      {
        id: "sales",
        label:
          "Gánh nặng chi phí đội ngũ Sales: chi phí cố định quá lớn nhưng hiệu suất không đều, chưa tận dụng đòn bẩy đối tác.",
        unlocks: ["affiliate"],
      },
      {
        id: "voucher",
        label:
          "Khuyến mãi kém hiệu quả: không có công cụ phát hành eVoucher linh hoạt cho từng điểm bán hoặc toàn chuỗi.",
        unlocks: ["voucher"],
      },
    ],
  },
  {
    id: "expectations",
    step: 4,
    badge: "Bước 4 · Kỳ vọng",
    title: "Xác định Kỳ vọng và Mong muốn cốt lõi",
    question:
      "Nếu được nâng cấp một hệ quản trị hoàn chỉnh, doanh nghiệp mong muốn tính năng nào hoạt động đầu tiên?",
    multi: true,
    options: [
      {
        id: "dashboard",
        label:
          "Dashboard kế toán hiển thị tự động toàn bộ dòng thu/chi hệ sinh thái theo thời gian thực (Real-time).",
        unlocks: ["finance"],
      },
      {
        id: "closed_store",
        label:
          "Hệ thống quản lý điểm bán khép kín: giám sát đầu vào, doanh số đầu ra và phát hành eVoucher kích cầu tại chỗ.",
        unlocks: ["store", "voucher"],
      },
      {
        id: "payroll",
        label:
          "Module quản lý nhân sự chuyên sâu, tự động hoá chấm công ca kíp 24/7 và tính lương tự động.",
        unlocks: ["hrm"],
      },
      {
        id: "affiliate_center",
        label:
          "Trung tâm thiết lập chính sách Affiliate tự động cho KOL/KOC, đại lý và đo lường doanh thu trực quan.",
        unlocks: ["affiliate"],
      },
    ],
  },
  {
    id: "barrier",
    step: 5,
    badge: "Bước 5 · Rào cản",
    title: "Chẩn đoán rào cản tài chính & thời gian",
    question:
      "Lý do lớn nhất khiến Doanh nghiệp trì hoãn việc chuyển đổi số toàn diện cho đến nay là gì?",
    multi: false,
    options: [
      {
        id: "cost",
        label: "Sợ chi phí quá đắt: báo giá hệ thống may đo quá khủng (vài trăm triệu đến hàng tỷ đồng).",
        unlocks: [],
      },
      {
        id: "time",
        label: "Sợ thời gian quá lâu: khảo sát, code thủ công kéo dài nhiều tháng làm mất cơ hội kinh doanh.",
        unlocks: [],
      },
      {
        id: "ops",
        label: "Sợ khó vận hành: hệ thống quá cồng kềnh, nhân viên tại điểm bán không đủ trình độ công nghệ.",
        unlocks: [],
      },
    ],
  },
];

export interface ModuleBlock {
  key: ModuleKey;
  icon: string;
  title: string;
  tagline: string;
  features: string[];
}

export const MODULE_BLOCKS: ModuleBlock[] = [
  {
    key: "store",
    icon: "🏪",
    title: "Nền Tảng Chuỗi Cung Ứng & Phân Phối Đa Tầng",
    tagline: "Khối 1 · Enterprise Supply Chain Hub",
    features: [
      "Kiến trúc 5 Hub chiến lược: 4 Hub phân khu nội thành TP.HCM và 1 Hub Vùng quản lý liên tỉnh (Vũng Tàu, Bình Dương, Đồng Nai).",
      "Portal Hub Trưởng: đăng ký phân loại điểm bán (Cố định / Xe lưu động / Vending), cấu hình chiết khấu thương mại, phí vận chuyển & chính sách riêng từng điểm bán.",
      "Gom đơn tự động (Inventory Aggregation): điểm bán gửi yêu cầu nạp hàng ➡️ Hub trưởng duyệt ➡️ hệ thống gộp thành Hub Bulk Order đẩy thẳng về Dashboard Nhà máy (NSX) realtime.",
      "Quản trị Công nợ & Hạn mức Đại lý: theo dõi dòng tiền gối đầu từng Hub/điểm bán, tự cảnh báo nợ & khóa quyền lên đơn khi vượt hạn mức tín dụng.",
      "Luồng Hàng trả về / Hủy hàng (Reverse Logistics): ghi nhận hàng cận date, hàng lỗi trả ngược Điểm bán ➡️ Hub ➡️ Nhà máy, tự khấu trừ tồn kho công khai.",
    ],
  },
  {
    key: "pos",
    icon: "🛵",
    title: "Định Tuyến Đơn Hàng & Vận Chuyển Chặng Cuối",
    tagline: "Khối 2 · Auto-Routing & Last-Mile Delivery",
    features: [
      "Giao diện đặt hàng B2C: mua online, tích điểm đổi quà, áp dụng eVoucher toàn chuỗi.",
      "Thuật toán Auto-Routing thông minh: quét tọa độ GPS khách ➡️ tự đẩy đơn về điểm bán cố định / xe lưu động / Hub gần nhất còn đủ hàng tồn.",
      "Đẩy đơn Shipper tự động: điểm bán nhận đơn ➡️ kết nối API đẩy thông tin qua đơn vị vận chuyển / shipper nội bộ ➡️ cập nhật trạng thái giao hàng realtime.",
    ],
  },
  {
    key: "voucher",
    icon: "🎫",
    title: "Trung Tâm eVoucher Kích Cầu Linh Hoạt",
    tagline: "Khối 3 · eVoucher Engine",
    features: [
      "Cấu hình eVoucher đa năng: áp dụng riêng từng điểm bán đặc thù (xử lý hàng tồn tại chỗ) hoặc đồng bộ toàn chuỗi.",
      "Giới hạn điều kiện áp dụng: HSD, giá trị đơn tối thiểu, số lần dùng mỗi tài khoản để chống gian lận.",
      "Giải mã QR eVoucher tại màn hình POS dưới 1 giây, tự động trừ tiền vào hoá đơn.",
      "Đo lường hiệu quả: số mã đã phát, số mã đã kích hoạt và tổng doanh thu kích cầu.",
    ],
  },
  {
    key: "finance",
    icon: "🟦",
    title: "Dashboard Tài Chính, Tách Quỹ & Xuất Hóa Đơn Tự Động",
    tagline: "Khối 4 · Finance & e-Invoice",
    features: [
      "Biểu đồ Bento Grid kế toán real-time cập nhật mỗi 5 giây, tự trích lập quỹ cố định, quỹ tái đầu tư, quỹ từ thiện từ dòng doanh thu đầu ra.",
      "Khóa sổ kế toán nghiêm ngặt: chặn hoàn toàn chỉnh sửa hóa đơn lịch sử sau khi chốt ngày để ngăn gian lận nội bộ.",
      "Tích hợp Hóa đơn Điện tử tự động: đơn thanh toán thành công (VietQR động / tiền mặt) ➡️ tự gọi API xuất HĐĐT GTGT chính thức & gửi thẳng Email khách / đại lý.",
      "Nhật ký hành động (Audit Log): lưu vết vĩnh viễn mọi thao tác sửa đơn, xuất/nhập kho để đối soát.",
    ],
  },
  {
    key: "affiliate",
    icon: "🟥",
    title: "Chiến Dịch Marketing & Tự Động Hóa Affiliate KOL/KOC/Đại Lý",
    tagline: "Khối 5 · Growth & Affiliate Hub",
    features: [
      "Chính sách hoa hồng động: chiết khấu đa tầng / một tầng riêng biệt cho KOL, KOC, đại lý hoặc khách hàng thân thiết.",
      "Tự sinh định danh Whitelabel Link & Coupon riêng cho từng đối tác phân phối ra thị trường.",
      "Đo lường ROI tuyệt đối realtime: Click ➡️ Đặt/Mua ➡️ Thanh toán trên một màn hình tập trung; chỉ trả hoa hồng trên đơn thành công.",
      "Tận dụng đòn bẩy đối tác: biến đại lý, KOL/KOC và khách cũ thành mạng lưới bán hàng tự động.",
    ],
  },
  {
    key: "hrm",
    icon: "👥",
    title: "Quản Lý Nhân Sự & Chấm Công Tự Động 24/7",
    tagline: "Khối 6 · HRM Module",
    features: [
      "Cấu hình lịch làm việc xoay ca, tăng ca, ca gãy, trực liên tục 24/7 tại điểm bán lẻ, Spa hoặc Eco-stay.",
      "Chấm công đa phương thức: định vị GPS tại điểm bán hoặc quét QR động trên app nhân viên.",
      "Báo cáo chuyên cần real-time: ai đang trực, ai đi muộn / về sớm / vắng mặt.",
      "Kết xuất bảng lương tự động (Payroll) dựa trên số giờ công thực tế, giảm tải 90% cho kế toán.",
    ],
  },
  {
    key: "service",
    icon: "🟫",
    title: "Quản Trị Chuỗi Dịch Vụ & Đặt Lịch Chuyên Sâu",
    tagline: "Khối 7 · Spa · Thẩm mỹ · Clinic",
    features: [
      "Ma trận đặt lịch trực quan (Booking Grid) theo từng chi nhánh & ca trực kỹ thuật viên/bác sĩ.",
      "Quản lý hồ sơ điện tử lịch sử liệu trình, hình ảnh trước/sau của khách, ghi chú y tế/thẩm mỹ.",
      "Tự động gửi SMS/Email nhắc lịch hẹn, tái khám, chăm sóc định kỳ.",
      "Tự trừ kho vật tư tiêu hao theo định mức ngay khi hoàn thành ca dịch vụ.",
    ],
  },
  {
    key: "hotel",
    icon: "🔲",
    title: "Lưu Trú & Sơ Đồ Phòng Nghỉ Sinh Thái",
    tagline: "Khối 8 · Hotel & Farmstay PMS",
    features: [
      "Ma trận Bento Grid sơ đồ trạng thái phòng trực quan realtime (trống / đang ở / cần dọn).",
      "Tự động cấp phát Landing Page đặt phòng công khai kết nối trực tiếp DB lõi.",
      "Cơ chế tính giá Dynamic động theo ngày lễ, cuối tuần hoặc mùa cao điểm du lịch.",
      "Đồng bộ dòng tiền đặt phòng về Dashboard tài chính trung tâm.",
    ],
  },
];

export interface SurveyAnswers {
  business_model: string | null;
  ops_pains: string[];
  marketing_pains: string[];
  expectations: string[];
  barrier: string | null;
}

export const EMPTY_ANSWERS: SurveyAnswers = {
  business_model: null,
  ops_pains: [],
  marketing_pains: [],
  expectations: [],
  barrier: null,
};

/** Phân tích đáp án -> tập các khối giải pháp được mở khoá. Khối tài chính luôn bật. */
export function computeUnlocked(answers: SurveyAnswers): Set<ModuleKey> {
  const unlocked = new Set<ModuleKey>(["finance"]);
  for (const step of SURVEY_STEPS) {
    const value = answers[step.id];
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    for (const optId of selected) {
      const opt = step.options.find((o) => o.id === optId);
      opt?.unlocks.forEach((k) => unlocked.add(k));
    }
  }
  return unlocked;
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  Rocket,
  Sparkles,
  Clock,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import {
  SURVEY_STEPS,
  MODULE_BLOCKS,
  EMPTY_ANSWERS,
  computeUnlocked,
  type SurveyAnswers,
} from "@/lib/survey-audit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/survey-audit")({
  head: () => ({
    meta: [
      { title: "Khảo sát Chẩn đoán Doanh nghiệp — Qi Holding" },
      {
        name: "description",
        content:
          "Phễu chẩn đoán 5 bước & ma trận 8 khối siêu module: chẩn đoán nỗi đau vận hành, mở khoá đúng giải pháp quản trị cho chuỗi của bạn.",
      },
      { property: "og:title", content: "Khảo sát Chẩn đoán Doanh nghiệp — Qi Holding" },
      {
        property: "og:description",
        content:
          "Trả lời 5 câu hỏi, hệ thống tự động bật sáng các khối giải pháp phù hợp với mô hình của bạn.",
      },
    ],
  }),
  component: SurveyAuditPage,
});

type Phase = "intro" | "survey" | "result";

function SurveyAuditPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "radial-gradient(60rem 60rem at 80% -10%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 60%), radial-gradient(50rem 50rem at -10% 110%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 55%)",
        }}
      >
        <SurveyAuditInner />
      </div>
    </div>
  );
}

function SurveyAuditInner() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(EMPTY_ANSWERS);

  const step = SURVEY_STEPS[stepIndex];
  const progress = ((stepIndex + (phase === "result" ? 1 : 0)) / SURVEY_STEPS.length) * 100;
  const unlocked = useMemo(() => computeUnlocked(answers), [answers]);

  function toggle(optId: string) {
    const key = step.id;
    if (!step.multi) {
      setAnswers((prev) => ({ ...prev, [key]: optId }) as SurveyAnswers);
      // tự động tiến bước cho câu single-choice (gọi ngoài updater để tránh double-fire)
      window.setTimeout(() => advance(), 240);
      return;
    }
    setAnswers((prev) => {
      const arr = (prev[key] as string[]) ?? [];
      const exists = arr.includes(optId);
      return {
        ...prev,
        [key]: exists ? arr.filter((x) => x !== optId) : [...arr, optId],
      } as SurveyAnswers;
    });
  }

  function isSelected(optId: string) {
    const v = answers[step.id];
    return Array.isArray(v) ? v.includes(optId) : v === optId;
  }

  const currentHasAnswer = (() => {
    const v = answers[step.id];
    return Array.isArray(v) ? v.length > 0 : !!v;
  })();

  function advance() {
    if (stepIndex < SURVEY_STEPS.length - 1) setStepIndex((i) => i + 1);
    else setPhase("result");
  }

  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else setPhase("intro");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      {/* Brand bar */}
      <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">Qi Holding</p>
            <p className="truncate text-xs text-muted-foreground">Hệ sinh thái Công nghệ Quản trị</p>
          </div>
        </div>
        <Link
          to="/"
          className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Trang chủ
        </Link>
      </header>

      {phase === "intro" && <Intro onStart={() => setPhase("survey")} />}

      {phase === "survey" && (
        <section>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{step.badge}</span>
              <span>
                {stepIndex + 1} / {SURVEY_STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>

          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{step.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{step.question}</p>
          {step.multi && (
            <p className="mt-1 text-xs text-accent">Có thể chọn nhiều đáp án.</p>
          )}

          <div className="mt-6 grid gap-3">
            {step.options.map((opt) => {
              const active = isSelected(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    "group flex items-start gap-3 rounded-3xl border p-4 text-left transition-all",
                    active
                      ? "border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]"
                      : "border-border bg-card/60 hover:border-accent/50 hover:bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-muted-foreground/40 text-transparent",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
            {step.multi && (
              <Button onClick={advance} disabled={!currentHasAnswer}>
                {stepIndex === SURVEY_STEPS.length - 1 ? "Xem kết quả" : "Tiếp tục"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      )}

      {phase === "result" && (
        <Result
          answers={answers}
          unlocked={unlocked}
          onRestart={() => {
            setAnswers(EMPTY_ANSWERS);
            setStepIndex(0);
            setPhase("intro");
          }}
        />
      )}
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 sm:p-10">
      <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
        <Sparkles className="h-3.5 w-3.5" /> Quy trình chẩn đoán 5 bước
      </span>
      <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-4xl">
        Hệ thống Quản trị <span className="text-accent">Sản xuất · Phân phối · Bán lẻ chuỗi</span>{" "}
        toàn diện cho doanh nghiệp của bạn
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Trả lời 5 câu hỏi ngắn. Hệ thống tự động phân tích và bật sáng các khối siêu module phù hợp
        nhất — từ chuỗi cung ứng đa tầng, định tuyến giao hàng, eVoucher, tài chính & hóa đơn điện
        tử đến nhân sự, dịch vụ và lưu trú. Áp dụng chung cho thực phẩm chay và trà trái cây đóng lon.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: <Rocket className="h-4 w-4" />, t: "Bàn giao thần tốc 7–14 ngày" },
          { icon: <ShieldCheck className="h-4 w-4" />, t: "Kiến trúc 8 khối tích hợp sẵn" },
          { icon: <Headphones className="h-4 w-4" />, t: "Hỗ trợ vận hành 24/7" },
        ].map((x, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm"
          >
            <span className="text-accent">{x.icon}</span>
            {x.t}
          </div>
        ))}
      </div>
      <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={onStart}>
        Bắt đầu khảo sát <ArrowRight className="h-4 w-4" />
      </Button>
    </section>
  );
}

function Result({
  answers,
  unlocked,
  onRestart,
}: {
  answers: SurveyAnswers;
  unlocked: Set<string>;
  onRestart: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const unlockedCount = MODULE_BLOCKS.filter((b) => unlocked.has(b.key)).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại để nhận tư vấn.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("survey_leads").insert({
      business_model: answers.business_model,
      ops_pains: answers.ops_pains,
      marketing_pains: answers.marketing_pains,
      expectations: answers.expectations,
      barrier: answers.barrier,
      unlocked_modules: Array.from(unlocked),
      contact_name: name.trim(),
      contact_phone: phone.trim(),
      contact_email: email.trim() || null,
      contact_company: company.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Gửi thông tin thất bại", { description: error.message });
      return;
    }
    setDone(true);
    toast.success("Đã gửi! Đội ngũ Qi Holding sẽ liên hệ tư vấn sớm.");
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-accent/40 bg-accent/10 p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" /> Kết quả chẩn đoán
        </span>
        <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
          Hệ thống đã mở khoá <span className="text-accent">{unlockedCount}/8 khối</span> siêu giải
          pháp cho bạn
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Các khối sáng dưới đây tương thích trực tiếp với câu trả lời của bạn và có thể kích hoạt
          ngay trên hạ tầng lõi.
        </p>
      </div>

      {/* Bento matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_BLOCKS.map((block, idx) => {
          const on = unlocked.has(block.key);
          const big = on && idx % 5 === 0;
          return (
            <div
              key={block.key}
              className={cn(
                "relative overflow-hidden rounded-3xl border p-5 transition-all",
                big && "sm:col-span-2",
                on
                  ? "border-accent/50 bg-card shadow-[0_8px_40px_-12px_color-mix(in_oklab,var(--accent)_45%,transparent)]"
                  : "border-border bg-card/40 opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{block.icon}</span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {block.tagline}
                    </p>
                    <h3 className="text-sm font-bold leading-snug">{block.title}</h3>
                  </div>
                </div>
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs",
                    on
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {on ? <Check className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {block.features.map((f, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Check
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        on ? "text-accent" : "text-muted-foreground/50",
                      )}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* CTA + lead capture */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-8">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold">Cảm ơn bạn!</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Thông tin đã được ghi nhận. Đội ngũ Qi Holding sẽ liên hệ để kích hoạt trải nghiệm miễn
              phí phân hệ doanh nghiệp trong 30 ngày.
            </p>
            <Button variant="outline" onClick={onRestart} className="mt-2">
              Làm lại khảo sát
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-black leading-tight tracking-tight sm:text-2xl">
                🚀 Cần hệ thống hoàn chỉnh nhưng sợ chi phí lớn & triển khai lâu?
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    <strong className="text-foreground">Giải pháp linh hoạt theo quy mô:</strong> từ
                    gói thuê bao chi phí cực thấp cho điểm bán đơn lẻ đến giải pháp may đo trọn gói
                    cho chuỗi lớn.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    <strong className="text-foreground">Bàn giao thần tốc 7–14 ngày:</strong> hệ
                    thống lõi đã hoàn thiện, sẵn sàng cấu hình chạy trên tên miền riêng của bạn.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    <strong className="text-foreground">Hỗ trợ vận hành 24/7:</strong> đội ngũ kỹ sư
                    túc trực để dòng chảy vận hành không bao giờ gián đoạn.
                  </span>
                </li>
              </ul>
            </div>
            <form onSubmit={submit} className="space-y-3 rounded-3xl border border-border bg-background/40 p-5">
              <p className="text-sm font-semibold">Đăng ký nhận tư vấn & trải nghiệm miễn phí 30 ngày</p>
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Họ và tên *</Label>
                <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">Số điện thoại *</Label>
                <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-email">Email</Label>
                  <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-company">Doanh nghiệp</Label>
                  <Input id="s-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={150} />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                ĐĂNG KÝ NHẬN TƯ VẤN & TRẢI NGHIỆM MIỄN PHÍ PHÂN HỆ DOANH NGHIỆP TRONG 30 NGÀY NGAY
              </Button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Làm lại khảo sát
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
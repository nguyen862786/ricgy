import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Ruler } from "lucide-react";

export const Route = createFileRoute("/huong-dan-size")({
  head: () => ({
    meta: [
      { title: "Hướng dẫn chọn size — RICGY" },
      { name: "description", content: "Bảng size chi tiết & cách đo cho phái nữ — chọn vừa vặn ngay từ lần đầu." },
      { property: "og:title", content: "Hướng dẫn chọn size — RICGY" },
      { property: "og:description", content: "Cách đo, bảng size theo dòng, gợi ý theo vóc dáng." },
    ],
  }),
  component: SizeGuide,
});

const MAIN_TABLE = [
  { size: "XS", chest: "78–82", waist: "60–64", hip: "84–88", weight: "38–42" },
  { size: "S",  chest: "82–86", waist: "64–68", hip: "88–92", weight: "42–48" },
  { size: "M",  chest: "86–90", waist: "68–72", hip: "92–96", weight: "48–54" },
  { size: "L",  chest: "90–95", waist: "72–78", hip: "96–102", weight: "54–62" },
  { size: "XL", chest: "95–100", waist: "78–84", hip: "102–108", weight: "62–70" },
];

const STEPS = [
  { n: "01", title: "Vòng ngực", desc: "Đo qua điểm đầy nhất của ngực, thước song song với sàn, không siết chặt." },
  { n: "02", title: "Vòng eo",    desc: "Đo chỗ nhỏ nhất, thường cách rốn ~2cm phía trên. Thở ra tự nhiên, không hít bụng." },
  { n: "03", title: "Vòng mông",  desc: "Đứng thẳng, hai chân khép, đo ngang điểm đầy nhất của hông." },
];

const SHAPES = [
  { title: "Mảnh mai", tip: "Phom xòe, nhún eo để tạo độ phồng tự nhiên — tránh suông quá rộng." },
  { title: "Đầy đặn", tip: "Phom suông, chất rơi mềm; ưu tiên màu Ink/Teal làm tôn dáng." },
  { title: "Cao ráo", tip: "Midi/Maxi tận dụng chiều dài. Crop + quần cạp cao chia tỉ lệ rất ăn." },
  { title: "Nhỏ nhắn", tip: "Mini hoặc đầm eo cao, tránh maxi quét đất khiến dáng thấp đi." },
];

function Table({ rows }: { rows: typeof MAIN_TABLE }) {
  return (
    <div className="overflow-x-auto border border-foreground/15">
      <table className="w-full text-left text-sm">
        <thead className="bg-foreground text-background font-mono-tag text-[11px] uppercase">
          <tr>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Ngực (cm)</th>
            <th className="px-4 py-3">Eo (cm)</th>
            <th className="px-4 py-3">Mông (cm)</th>
            <th className="px-4 py-3">Cân nặng (kg)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.size} className="border-t border-foreground/10 hover:bg-secondary/40">
              <td className="px-4 py-3 font-display text-lg">{r.size}</td>
              <td className="px-4 py-3 font-mono-tag">{r.chest}</td>
              <td className="px-4 py-3 font-mono-tag">{r.waist}</td>
              <td className="px-4 py-3 font-mono-tag">{r.hip}</td>
              <td className="px-4 py-3 font-mono-tag">{r.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SizeGuide() {
  return (
    <>
      {/* HERO */}
      <section className="pt-28 lg:pt-36 pb-16 px-5 lg:px-10 border-b border-foreground/15">
        <div className="mx-auto max-w-[1100px]">
          <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)] flex items-center gap-2">
            <Ruler className="size-3.5" /> Size Guide / SS-26
          </p>
          <h1 className="mt-5 font-display text-5xl lg:text-8xl">
            Tìm size <span className="text-[var(--fuchsia-pop)]">vừa vặn</span>
            <br />
            <span className="font-serif italic font-normal normal-case">như may đo.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            RICGY hiểu mỗi cô gái một dáng. Đây là cách chọn đúng ngay từ lần đầu —
            không cần đoán, không cần đổi.
          </p>
        </div>
      </section>

      {/* 3 STEPS */}
      <section className="px-5 lg:px-10 py-20">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-3xl lg:text-5xl mb-10">Đo trong 3 bước</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="border border-foreground p-6 lg:p-8 h-full bg-background">
                  <span className="font-display text-5xl text-[var(--fuchsia-pop)]">{s.n}</span>
                  <h3 className="mt-3 font-serif text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 font-mono-tag text-[11px] uppercase text-muted-foreground">
            Mẹo: mặc đồ lót mỏng, dùng thước dây mềm, nhờ một người khác đo sẽ chính xác hơn.
          </p>
        </div>
      </section>

      {/* MAIN TABLE */}
      <section className="px-5 lg:px-10 py-16 bg-secondary/40">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-3xl lg:text-5xl mb-8">Bảng size chuẩn</h2>
          <Table rows={MAIN_TABLE} />
          <p className="mt-4 font-mono-tag text-[11px] uppercase text-muted-foreground">
            * Số đo tham khảo. Phom thực tế có thể chênh ±1cm tuỳ chất liệu.
          </p>
        </div>
      </section>

      {/* TABS PER LINE */}
      <section className="px-5 lg:px-10 py-20">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-3xl lg:text-5xl mb-8">Bảng size theo dòng</h2>
          <Tabs defaultValue="cong-so">
            <TabsList className="bg-transparent gap-0 border-b border-foreground/15 w-full justify-start rounded-none h-auto p-0">
              {[
                ["cong-so", "Công sở"],
                ["di-choi", "Đi chơi"],
                ["sleep", "Sleepwear"],
                ["the-thao", "Thể thao"],
              ].map(([v, l]) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="font-mono-tag text-[11px] uppercase rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background px-5 py-3"
                >
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="cong-so" className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Phom ôm hơn 1 chút để tôn dáng — chọn đúng size theo bảng chuẩn.</p>
              <Table rows={MAIN_TABLE} />
            </TabsContent>
            <TabsContent value="di-choi" className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Phom theo bảng chuẩn — chọn đúng size cơ thể.</p>
              <Table rows={MAIN_TABLE} />
            </TabsContent>
            <TabsContent value="sleep" className="mt-6 space-y-3">
              <p className="text-sm text-[var(--fuchsia-pop)]">Sleepwear nên chọn rộng hơn 1 size cho cảm giác thoải mái.</p>
              <Table rows={MAIN_TABLE} />
            </TabsContent>
            <TabsContent value="the-thao" className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Chất co giãn 4 chiều — chọn đúng size hoặc nhỏ hơn 1 size nếu thích ôm gọn.</p>
              <Table rows={MAIN_TABLE} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* SHAPES */}
      <section className="px-5 lg:px-10 py-20 border-y border-foreground/15">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-3xl lg:text-5xl mb-10">Gợi ý theo vóc dáng</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SHAPES.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="border border-foreground/15 p-6 h-full hover:border-[var(--fuchsia-pop)] transition-colors">
                  <h3 className="font-serif text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.tip}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 lg:px-10 py-20">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-display text-3xl lg:text-5xl mb-8">Câu hỏi thường gặp</h2>
          <Accordion type="single" collapsible className="border-t border-foreground/15">
            <AccordionItem value="q1" className="border-b border-foreground/15">
              <AccordionTrigger className="font-serif text-lg text-left">Giữa 2 size nên chọn size nào?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Với phom ôm (đầm công sở, đầm đi chơi) → chọn size nhỏ hơn để tôn dáng.
                Với phom suông/oversized/sleepwear → chọn size lớn hơn cho thoải mái.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="border-b border-foreground/15">
              <AccordionTrigger className="font-serif text-lg text-left">Đặt qua Zalo có đổi size được không?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Có. RICGY hỗ trợ đổi size trong vòng 7 ngày kể từ khi nhận hàng, sản phẩm còn nguyên tag và chưa giặt.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-b border-foreground/15">
              <AccordionTrigger className="font-serif text-lg text-left">Cao 1m55, nặng 50kg mặc size gì?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Thường size M là phù hợp. Tuy nhiên đo 3 vòng để chính xác hơn — vì có nàng cùng cân nặng nhưng số đo khác nhau.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="border-b border-foreground/15">
              <AccordionTrigger className="font-serif text-lg text-left">Đo vòng ngực có cần cởi áo lót không?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Mặc áo lót thường ngày khi đo để có số đo gần với thực tế khi diện đầm. Tránh áo lót quá đệm.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 lg:px-10 pb-24">
        <div className="mx-auto max-w-[1100px] bg-foreground text-background p-10 lg:p-16 text-center">
          <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)] mb-4">Vẫn phân vân?</p>
          <h2 className="font-display text-3xl lg:text-5xl">
            Nhắn số đo qua Zalo —<br />
            tư vấn size <span className="text-[var(--fuchsia-pop)]">trong 5 phút.</span>
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a href={SITE.zalo} target="_blank" rel="noreferrer" className="px-7 py-4 bg-[var(--fuchsia-pop)] text-background font-mono-tag text-[12px] uppercase inline-flex items-center gap-2">
              Tư vấn Zalo <ArrowRight className="size-4" />
            </a>
            <Link to="/lien-he" className="px-7 py-4 border border-background/40 font-mono-tag text-[12px] uppercase">
              Form liên hệ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

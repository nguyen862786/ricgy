import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import hero from "@/assets/hero.jpg";
import look2 from "@/assets/look-2.jpg";
import look3 from "@/assets/look-3.jpg";

export const Route = createFileRoute("/ve-chung-toi")({
  head: () => ({
    meta: [
      { title: "Về RICGY — Câu chuyện thương hiệu" },
      { name: "description", content: "RICGY — thương hiệu thời trang nữ Việt với hành trình mang đến những thiết kế tinh tế, hiện đại cho phụ nữ Việt." },
      { property: "og:title", content: "Về RICGY" },
      { property: "og:description", content: "Câu chuyện của một thương hiệu thời trang nữ Việt." },
      { property: "og:image", content: hero },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { no: "01", title: "Tinh tế", desc: "Mỗi chi tiết đều được chăm chút, từ chất liệu đến đường may." },
  { no: "02", title: "Hiện đại", desc: "Cập nhật xu hướng quốc tế, phù hợp với phong cách Việt." },
  { no: "03", title: "Nữ tính", desc: "Tôn vinh vẻ đẹp tự nhiên và sự tự tin của người phụ nữ." },
  { no: "04", title: "Tận tâm", desc: "Đồng hành cùng nàng trong mọi khoảnh khắc của cuộc sống." },
];

function AboutPage() {
  return (
    <>
      <section className="px-5 lg:px-10 pt-16 lg:pt-32 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1400px] grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <Reveal className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-5">Câu chuyện</p>
            <h1 className="font-serif text-5xl lg:text-7xl leading-[0.98]">
              Mỗi nàng RICGY là một <span className="italic text-primary">phiên bản đẹp</span> của chính mình.
            </h1>
            <p className="mt-7 text-lg text-muted-foreground leading-relaxed max-w-xl">
              RICGY ra đời từ niềm tin rằng thời trang không chỉ là quần áo — mà là cách phụ nữ kể câu
              chuyện riêng của mình mỗi ngày. Từ sáng làm việc, chiều thể thao, tối dạ tiệc đến đêm thư
              giãn — RICGY luôn ở đó.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={look3} alt="Về RICGY" className="size-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 lg:px-10 py-24 bg-secondary/40">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading eyebrow="Giá trị cốt lõi" title="Bốn điều" italic="chúng tôi tin." align="center" />
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v, i) => (
              <Reveal key={v.no} delay={i * 0.08}>
                <div>
                  <p className="font-serif text-5xl lg:text-6xl text-primary">{v.no}</p>
                  <h3 className="mt-4 font-serif text-2xl">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 lg:px-10 py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal>
            <div className="aspect-[4/5] overflow-hidden">
              <img src={look2} alt="Hậu trường RICGY" className="size-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Sản xuất tại Việt Nam</p>
            <h2 className="mt-4 font-serif text-4xl lg:text-5xl leading-tight">
              Từng đường may, <span className="italic text-primary">từng tâm huyết.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Tất cả sản phẩm RICGY được thiết kế và sản xuất tại Việt Nam, sử dụng chất liệu cao cấp
              được tuyển chọn kỹ lưỡng. Chúng tôi tin rằng sản phẩm đẹp đến từ sự tận tâm trong từng
              công đoạn.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

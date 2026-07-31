import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import look1 from "@/assets/look-1.jpg";
import look2 from "@/assets/look-2.jpg";
import look3 from "@/assets/look-3.jpg";
import hero from "@/assets/hero.jpg";
import catOffice from "@/assets/cat-office.jpg";
import catSport from "@/assets/cat-sport.jpg";
import catParty from "@/assets/cat-party.jpg";
import catSleep from "@/assets/cat-sleep.jpg";

const STORIES = [
  {
    image: catOffice,
    cat: "Workwear",
    title: "Một ngày làm việc cùng RICGY",
    excerpt: "Khám phá outfit công sở chuẩn từ sáng đến tối, vừa thanh lịch vừa thoải mái.",
  },
  {
    image: catSport,
    cat: "Active",
    title: "Sân tennis hồng pastel",
    excerpt: "Bộ ảnh sport mới nhất với những thiết kế tennis & golf nữ tính nhất 2026.",
  },
  {
    image: catParty,
    cat: "Party",
    title: "Tối thứ Bảy của nàng",
    excerpt: "Những chiếc đầm dạ tiệc lung linh, sẵn sàng cho mọi cuộc hẹn cuối tuần.",
  },
  {
    image: catSleep,
    cat: "Sleepwear",
    title: "Sáng chủ nhật êm đềm",
    excerpt: "Sleepwear lụa mềm mại — món quà cho chính mình sau một tuần dài.",
  },
];

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook — RICGY" },
      { name: "description", content: "Lookbook RICGY — khám phá phong cách thời trang nữ qua hình ảnh và video." },
      { property: "og:title", content: "Lookbook — RICGY" },
      { property: "og:description", content: "Câu chuyện thương hiệu bằng hình ảnh." },
      { property: "og:image", content: look1 },
    ],
  }),
  component: LookbookPage,
});

function LookbookPage() {
  return (
    <>
      <section className="px-5 lg:px-10 pt-16 lg:pt-24 pb-16">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            eyebrow="Lookbook 2026"
            title="Câu chuyện"
            italic="của nàng RICGY"
            description="Một bộ sưu tập hình ảnh và bài viết về phong cách, cảm hứng và những khoảnh khắc đẹp nhất."
            align="center"
          />
        </div>
      </section>

      {/* BENTO GALLERY */}
      <section className="px-5 lg:px-10">
        <div className="mx-auto max-w-[1400px] grid grid-cols-12 grid-rows-2 gap-3 lg:gap-5">
          <Reveal className="col-span-12 lg:col-span-8 lg:row-span-2">
            <div className="aspect-[4/5] lg:aspect-auto lg:h-full overflow-hidden">
              <img src={hero} alt="Look 1" className="size-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="col-span-6 lg:col-span-4">
            <div className="aspect-square overflow-hidden">
              <img src={look3} alt="Look 2" className="size-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.15} className="col-span-6 lg:col-span-4">
            <div className="aspect-square overflow-hidden bg-primary text-primary-foreground p-6 lg:p-10 flex flex-col justify-between">
              <p className="text-xs uppercase tracking-[0.3em] opacity-80">Edition 02</p>
              <p className="font-serif text-2xl lg:text-4xl italic leading-tight">
                "Spring whispers in pink & lavender."
              </p>
            </div>
          </Reveal>
          <Reveal className="col-span-6 lg:col-span-4">
            <div className="aspect-square overflow-hidden">
              <img src={look1} alt="Look 3" className="size-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="col-span-6 lg:col-span-4">
            <div className="aspect-square overflow-hidden">
              <img src={look2} alt="Look 4" className="size-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.15} className="col-span-12 lg:col-span-4">
            <div className="aspect-square overflow-hidden">
              <img src={catParty} alt="Look 5" className="size-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* STORIES BLOG */}
      <section className="px-5 lg:px-10 py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex justify-between items-end mb-12">
            <SectionHeading eyebrow="Stories" title="Bài viết" italic="mới nhất" />
            <p className="hidden sm:block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cập nhật hàng tuần
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {STORIES.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <article className="group cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={s.image} alt={s.title} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="pt-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-primary">{s.cat}</p>
                    <h3 className="mt-2 font-serif text-2xl lg:text-3xl group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">{s.excerpt}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

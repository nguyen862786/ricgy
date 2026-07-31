import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { SITE } from "@/lib/site";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/lien-he")({
  head: () => ({
    meta: [
      { title: "Liên hệ — RICGY" },
      { name: "description", content: "Liên hệ RICGY qua Zalo, Messenger, điện thoại hoặc ghé thăm showroom." },
      { property: "og:title", content: "Liên hệ — RICGY" },
      { property: "og:description", content: "Đội ngũ RICGY luôn sẵn sàng hỗ trợ bạn." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <section className="px-5 lg:px-10 py-16 lg:py-32">
      <div className="mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-12 lg:gap-20">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Liên hệ</p>
          <h1 className="mt-4 font-serif text-5xl lg:text-7xl leading-[0.98]">
            Chúng ta hãy <span className="italic text-primary">trò chuyện</span> nhé.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-md">
            Đội ngũ RICGY luôn sẵn sàng tư vấn outfit, size và đặt hàng — nhanh nhất qua Zalo và
            Messenger.
          </p>

          <div className="mt-10 space-y-5">
            <a
              href={SITE.zalo}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 p-5 bg-primary text-primary-foreground hover:bg-accent transition-colors"
            >
              <MessageCircle className="size-6 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">Nhanh nhất</p>
                <p className="font-serif text-2xl">Nhắn Zalo</p>
              </div>
            </a>
            <a
              href={SITE.messenger}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 p-5 border border-border hover:border-primary transition-colors"
            >
              <MessageCircle className="size-6 shrink-0 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Facebook</p>
                <p className="font-serif text-2xl">Messenger</p>
              </div>
            </a>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-4 border border-border">
                <Phone className="size-5 shrink-0 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hotline</p>
                  <p className="font-serif text-lg mt-0.5">{SITE.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border">
                <Mail className="size-5 shrink-0 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                  <p className="font-serif text-lg mt-0.5 break-all">{SITE.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-border">
              <MapPin className="size-5 shrink-0 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Showroom</p>
                <p className="font-serif text-lg mt-0.5">{SITE.address}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.open(SITE.zalo, "_blank");
            }}
            className="bg-secondary/50 p-8 lg:p-10"
          >
            <h2 className="font-serif text-3xl">Gửi tin nhắn</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hoặc nhanh hơn — nhắn trực tiếp qua Zalo bên trái.
            </p>
            <div className="mt-8 space-y-5">
              <Field label="Họ và tên" type="text" placeholder="Nguyễn Phương Uyên" />
              <Field label="Số điện thoại" type="tel" placeholder="0900 000 000" />
              <Field label="Email" type="email" placeholder="ban@email.com" />
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Nội dung
                </label>
                <textarea
                  rows={5}
                  placeholder="Bạn cần tư vấn gì ạ?"
                  className="mt-2 w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full px-7 py-4 bg-primary text-primary-foreground text-sm uppercase tracking-[0.2em] hover:bg-accent transition-colors"
              >
                Gửi & Mở Zalo
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({ label, type, placeholder }: { label: string; type: string; placeholder: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}

import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  italic,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  italic?: string;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Reveal>
      <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">{eyebrow}</p>
        )}
        <h2 className="font-serif text-4xl lg:text-6xl leading-[1.05] text-foreground">
          {title}
          {italic && <span className="italic text-primary"> {italic}</span>}
        </h2>
        {description && (
          <p className="mt-5 text-base lg:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Reveal>
  );
}

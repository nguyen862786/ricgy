import { motion } from "framer-motion";

export function Marquee({ items }: { items: string[] }) {
  const loop = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-foreground bg-foreground text-background py-6">
      <motion.div
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="flex gap-10 whitespace-nowrap"
      >
        {loop.map((t, i) => (
          <span
            key={i}
            className="font-display text-3xl lg:text-5xl flex items-center gap-10"
          >
            {t}
            <span className="text-[var(--fuchsia-pop)]">✺</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

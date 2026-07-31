import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share2, Sparkles } from "lucide-react";
import clip from "@/assets/viral-clip.mp4.asset.json";
import { Reveal } from "./Reveal";

export function ViralClip() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState(12843);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="relative px-5 lg:px-10 py-24 lg:py-36 overflow-hidden">
      {/* floating gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 size-[480px] rounded-full bg-primary/30 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 size-[520px] rounded-full bg-accent/40 blur-3xl"
        />
      </div>

      <div className="mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Phone frame */}
        <Reveal className="flex justify-center lg:justify-end order-2 lg:order-1">
          <div className="relative">
            {/* halo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 rounded-[3rem] bg-gradient-to-tr from-primary via-accent to-primary blur-2xl opacity-60"
            />
            <div className="relative w-[300px] sm:w-[340px] aspect-[9/19] rounded-[2.5rem] bg-foreground p-3 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-20" />
              <div className="relative size-full rounded-[2rem] overflow-hidden bg-black">
                <video
                  ref={ref}
                  src={clip.url}
                  autoPlay
                  muted={muted}
                  loop
                  playsInline
                  onClick={toggle}
                  className="size-full object-cover"
                />

                {/* TikTok-like UI overlay */}
                <div className="absolute right-3 bottom-20 flex flex-col gap-5 text-background">
                  <button
                    onClick={() => {
                      setLiked(!liked);
                      setLikes((l) => l + (liked ? -1 : 1));
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <motion.div
                      whileTap={{ scale: 1.4 }}
                      className={`size-11 rounded-full backdrop-blur bg-foreground/30 grid place-items-center ${liked ? "text-primary" : ""}`}
                    >
                      <Heart className={`size-6 ${liked ? "fill-primary" : ""}`} />
                    </motion.div>
                    <span className="text-xs font-medium">{(likes / 1000).toFixed(1)}K</span>
                  </button>
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-11 rounded-full backdrop-blur bg-foreground/30 grid place-items-center">
                      <MessageCircle className="size-6" />
                    </div>
                    <span className="text-xs">328</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-11 rounded-full backdrop-blur bg-foreground/30 grid place-items-center">
                      <Share2 className="size-6" />
                    </div>
                    <span className="text-xs">Share</span>
                  </div>
                </div>

                <div className="absolute left-3 right-16 bottom-4 text-background">
                  <p className="font-serif italic text-lg">@ricgy_official</p>
                  <p className="text-xs opacity-90 mt-1">
                    SS/26 — Bold &amp; Soft drop ✨ #RICGYgirl
                  </p>
                </div>

                {/* play/mute controls */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMuted(!muted);
                    }}
                    className="size-9 rounded-full bg-foreground/40 backdrop-blur grid place-items-center text-background"
                  >
                    {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                  <button
                    onClick={toggle}
                    className="size-9 rounded-full bg-foreground/40 backdrop-blur grid place-items-center text-background"
                  >
                    {playing ? <Play className="size-4" /> : <Pause className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* sticker badges */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-6, -2, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 top-12 bg-background border border-primary/30 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            >
              <Sparkles className="size-4 text-primary" />
              <span className="text-xs font-medium">Viral 1.2M views</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [4, 8, 4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-24 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-xl"
            >
              <span className="text-xs uppercase tracking-widest">New drop 🌸</span>
            </motion.div>
          </div>
        </Reveal>

        {/* Text */}
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">
            Viral on TikTok & Reels
          </p>
          <h2 className="font-serif text-4xl lg:text-6xl leading-[1.05]">
            Đang khiến cả MXH
            <span className="italic text-primary"> phát cuồng.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base lg:text-lg leading-relaxed max-w-md">
            Clip mới nhất của RICGY đạt hơn 1 triệu lượt xem chỉ sau 48 giờ. Chiếc đầm pastel
            xoay tròn trong ánh nắng — outfit mà mọi cô gái đều muốn sở hữu mùa này.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="font-serif text-3xl text-primary">1.2M</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Lượt xem</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-primary">87K</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Tim</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-primary">4.5K</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Chia sẻ</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

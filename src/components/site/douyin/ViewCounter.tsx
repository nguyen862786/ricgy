import { useEffect, useState } from "react";

export function ViewCounter({ start = 12450 }: { start?: number }) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + Math.floor(Math.random() * 9) + 1), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono-tag tabular-nums">
      {n.toLocaleString("en-US")}
    </span>
  );
}

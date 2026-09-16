const TINTS = [
  "from-[#8fb0ff]/30 to-[#c4a7ff]/10",
  "from-[#5fd4a4]/25 to-[#8fb0ff]/10",
  "from-[#e7c37a]/25 to-[#ff7a7a]/10",
  "from-[#c4a7ff]/30 to-[#8fb0ff]/10",
];

export function EntityMark({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const tint = TINTS[name.length % TINTS.length];
  const box = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm";

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tint} font-medium ring-1 ring-white/10`}
    >
      {initial}
    </span>
  );
}

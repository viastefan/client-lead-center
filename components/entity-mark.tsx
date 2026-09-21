export function EntityMark({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const box = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";

  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-md bg-white/[0.08] font-medium text-muted`}>
      {initial}
    </span>
  );
}

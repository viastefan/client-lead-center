export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs";

  return (
    <span
      className={`flex ${box} items-center justify-center rounded-xl bg-accent font-medium text-accent-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}
    >
      C
    </span>
  );
}

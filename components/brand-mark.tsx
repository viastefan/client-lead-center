export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";

  return (
    <span className={`flex ${box} items-center justify-center rounded-md bg-white font-semibold text-black`}>
      C
    </span>
  );
}

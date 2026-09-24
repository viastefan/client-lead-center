import { brandDots } from "@/lib/brand/mark";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const px = size === "sm" ? 22 : 28;
  const dots = brandDots(32);

  return (
    <svg width={px} height={px} viewBox="0 0 32 32" fill="none" aria-hidden className="text-foreground">
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill="currentColor" />
      ))}
    </svg>
  );
}

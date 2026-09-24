import { ImageResponse } from "next/og";
import { brandDots } from "@/lib/brand/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const dots = brandDots(180);
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          background: "transparent",
          position: "relative",
        }}
      >
        {dots.map((dot, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: dot.x - dot.r,
              top: dot.y - dot.r,
              width: dot.r * 2,
              height: dot.r * 2,
              borderRadius: 999,
              background: "#ececee",
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}

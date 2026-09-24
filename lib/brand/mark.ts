export type BrandDot = { x: number; y: number; r: number };

/** Circle that dissolves into dots toward the upper-right. Transparent field, no plate. */
export function brandDots(size = 32): BrandDot[] {
  const cx = size / 2;
  const cy = size / 2;
  const dots: BrandDot[] = [];
  const rings = [
    { n: 1, radius: 0, r: size * 0.07 },
    { n: 6, radius: size * 0.15, r: size * 0.052 },
    { n: 11, radius: size * 0.275, r: size * 0.044 },
    { n: 16, radius: size * 0.4, r: size * 0.034 },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.n; i += 1) {
      const angle = ring.n === 1 ? 0 : (i / ring.n) * Math.PI * 2 - Math.PI / 2;
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const scatter = Math.max(0, nx * 0.78 + ny * -0.18) ** 1.25;
      if (ring.n > 6 && scatter > 0.72 && i % 2 === 0) continue;
      const radius = ring.radius * (1 + scatter * 0.7);
      const r = ring.r * (1 - scatter * 0.55);
      if (r < size * 0.01) continue;
      dots.push({ x: cx + nx * radius, y: cy + ny * radius, r });
    }
  }

  for (const extra of [
    { a: -0.35, d: 0.5, r: 0.026 },
    { a: -0.12, d: 0.58, r: 0.02 },
    { a: 0.08, d: 0.66, r: 0.015 },
    { a: 0.28, d: 0.74, r: 0.011 },
  ]) {
    dots.push({
      x: cx + Math.cos(extra.a) * size * extra.d,
      y: cy + Math.sin(extra.a) * size * extra.d,
      r: size * extra.r,
    });
  }

  return dots;
}

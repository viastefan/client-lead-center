export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-28 -top-40 h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(155,180,255,0.22),transparent_62%)] blur-3xl" />
      <div className="absolute -right-24 top-8 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(196,167,255,0.12),transparent_60%)] blur-3xl" />
      <div className="absolute bottom-[-14rem] left-1/3 h-[32rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(95,212,164,0.07),transparent_60%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22/></filter><rect width=%2260%22 height=%2260%22 filter=%22url(%23n)%22 opacity=%220.55%22/></svg>')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(5,6,10,0.78)_100%)]" />
    </div>
  );
}

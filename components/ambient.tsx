export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-32 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(143,176,255,0.28),transparent_62%)] blur-3xl" />
      <div className="absolute -right-20 top-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(196,167,255,0.2),transparent_60%)] blur-3xl" />
      <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(95,212,164,0.12),transparent_60%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(7,8,12,0.72)_100%)]" />
    </div>
  );
}

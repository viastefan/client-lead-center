export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 h-8 w-48 rounded-xl bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass h-24 rounded-3xl" />
        ))}
      </div>
      <div className="glass mt-6 h-56 rounded-3xl" />
    </div>
  );
}

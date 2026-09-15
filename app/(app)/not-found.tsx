export default function NotFound() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10">
      <h1 className="text-lg font-medium">Nicht gefunden</h1>
      <p className="mt-2 text-sm text-muted">Diese Ressource existiert nicht oder gehört zu einem anderen Mandanten.</p>
    </div>
  );
}

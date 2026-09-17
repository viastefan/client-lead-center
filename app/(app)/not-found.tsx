export default function NotFound() {
  return (
    <div className="glass-strong rounded-lg px-6 py-10">
      <h1 className="text-lg font-medium">Nicht gefunden</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Diese Ressource existiert nicht oder gehört zu einem anderen Mandanten.
      </p>
    </div>
  );
}

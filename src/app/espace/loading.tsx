// Squelette affiché pendant le chargement d'une page de l'espace membres.
export default function Chargement() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="space-y-8">
      <div className="squelette h-10 w-64 rounded-abm-sm" />
      <div className="squelette h-4 w-96 max-w-full rounded-abm-sm" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-abm-md border border-bordeaux-700/10 bg-white p-5">
            <div className="squelette h-3 w-28 rounded-abm-sm" />
            <div className="squelette h-6 w-48 rounded-abm-sm" />
            <div className="squelette h-4 w-full rounded-abm-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

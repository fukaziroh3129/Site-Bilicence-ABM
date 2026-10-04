// Enveloppe chaque page : léger fondu à chaque changement de page.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entree-page">{children}</div>;
}

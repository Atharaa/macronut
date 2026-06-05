export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* En-tête (bandeau dégradé) */}
      <div className="h-36 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
      {/* Carte secondaire */}
      <div className="h-24 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
      {/* Quelques cartes */}
      <div className="h-20 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
      <div className="h-20 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
      <div className="h-20 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
    </div>
  );
}

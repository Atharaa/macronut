# Navigation par jour — conception

Date : 2026-06-08
Statut : validé (conception)

## Objectif

Pouvoir consulter et **logger n'importe quel jour** (pas seulement aujourd'hui)
sur les écrans Journée (repas) et Activité. Couvre l'oubli (« je n'ai pas saisi
mon déjeuner d'hier ») et la consultation de l'historique.

Aujourd'hui tout est figé sur `startOfToday()` : l'affichage comme les actions
d'ajout écrivent en dur sur la date du jour.

Périmètre : **Journée + Activité**, en consultation ET en écriture rétroactive.
Poids (série temporelle) et Objectif (réglage unique) sont hors sujet.

## Décisions

- État de la date dans l'**URL** : `?d=YYYY-MM-DD` sur `/` et `/activite`.
  Absent / invalide / futur ⇒ aujourd'hui.
- Sélecteur : **flèches + date cliquable** (calendrier natif), lien
  « Aujourd'hui » quand on n'est pas sur le jour courant.
- **Futur bloqué** : pas de navigation au-delà d'aujourd'hui.
- Date **partagée** entre Journée et Activité (propagée par la barre de nav).
- Écriture rétroactive via un champ caché `date`, parsé comme dans
  `poids/actions.ts` (pattern existant).

## Helpers date (`src/lib/date.ts`)

Fonctions pures, testées. `startOfToday` et `startOfDay` existent déjà.

- `parseDateParam(value?: string): Date` — si `value` parse en date valide et
  `startOfDay(value) <= startOfToday()`, retourne `startOfDay(value)` ; sinon
  `startOfToday()`. (Clamp du futur et fallback en une fonction.)
- `toDateParam(date: Date): string` — format `"YYYY-MM-DD"` (composants UTC).
- `addDays(date: Date, n: number): Date` — décalage en jours (UTC).
- `isToday(date: Date): boolean` — `startOfDay(date)` égale `startOfToday()`.

## Sélecteur de jour (`src/components/DaySelector.tsx`)

Composant client. Props : `date: string` (le param ISO courant, ex
`"2026-06-05"`) et `basePath: string` (`"/"` ou `"/activite"`).

- Affiche `‹ <label> ›` où `<label>` est la date en français
  (`Intl.DateTimeFormat("fr-FR", { weekday:"short", day:"numeric", month:"short" })`),
  ou « Aujourd'hui » si `isToday`.
- Flèche précédente : `<Link>` vers `${basePath}?d=${toDateParam(addDays(d,-1))}`.
- Flèche suivante : `<Link>` vers le jour suivant, **masquée** si `isToday(d)`.
- Taper le label ouvre un `<input type="date">` natif (`max` = aujourd'hui) ;
  `onChange` ⇒ `router.push(${basePath}?d=${value})` (ou `basePath` seul si la
  valeur est aujourd'hui, pour garder l'URL propre).
- Lien « Aujourd'hui » (vers `basePath` sans param) affiché seulement si
  `!isToday(d)`.

## Pages serveur

`searchParams` est un `Promise` en Next 15 : `await` requis.

### `src/app/(app)/page.tsx`

- Signature : `JourneePage({ searchParams }: { searchParams: Promise<{ d?: string }> })`.
- `const { d } = await searchParams; const selectedDate = parseDateParam(d);`
- Remplacer `startOfToday()` par `selectedDate` pour : requête `meals`, requête
  `activities`, et la fenêtre des récents.
- Récents : `since = addDays(selectedDate, -30)`, requête
  `where: { userId, date: { gte: since, lte: selectedDate } }`.
- Rendre `<DaySelector date={toDateParam(selectedDate)} basePath="/" />` en haut
  de la page (avant l'en-tête dégradé).
- Passer `date={toDateParam(selectedDate)}` à `MealInput` et `RecentChips`.

### `src/app/(app)/activite/page.tsx`

- Même traitement : `searchParams`, `selectedDate`, requête `entries` sur
  `selectedDate`.
- Rendre `<DaySelector date={toDateParam(selectedDate)} basePath="/activite" />`.
- Passer `date={toDateParam(selectedDate)}` à `ActivityForm`.
- Le titre « Activité du jour » et le sous-texte « aujourd'hui » sont neutralisés
  (ex. « Activité ») pour ne pas mentir quand on consulte un autre jour.

## Écriture rétroactive (actions)

Pattern repris de `poids/actions.ts` : champ caché `date`, schéma
`z.coerce.date().optional()`, `const date = parsed.data.date ? startOfDay(parsed.data.date) : startOfToday()`.

- `addMeal` (`src/app/(app)/actions.ts`) : ajouter `date` au parse, passer `date`
  à `addFoodsFromText(user.id, date, mealType, text)` au lieu de `startOfToday()`.
- `addRecentFood` (`src/app/(app)/actions.ts`) : ajouter `date` au `recentSchema`
  (`z.coerce.date().optional()`), utiliser `date` dans le `meal.upsert`.
- `addActivity` (`src/app/(app)/activite/actions.ts`) : ajouter `date` au schéma,
  utiliser `date` dans `prisma.activityEntry.create`.

Inchangées (opèrent par id ; `revalidatePath("/")` couvre toutes les variantes
de query) : `deleteFoodItem`, `saveFoodMacros`, `updateActivity`,
`deleteActivity`.

## Formulaires (champ caché `date`)

- `MealInput({ mealType, date })` — ajouter `<input type="hidden" name="date" value={date} />`.
- `RecentChips({ mealType, date, recents })` — ajouter le champ caché `date`
  dans chaque `<form>` de chip.
- `ActivityForm({ date })` — ajouter le champ caché `date` ; le composant devient
  paramétré (actuellement sans props).

## Partage entre onglets (`src/components/BottomNav.tsx`)

- Lire le param courant via `useSearchParams().get("d")`.
- Pour les liens « / » et « /activite », ajouter `?d=<d>` si `d` est présent et
  non vide ; sinon lien nu. Liens « /poids » et « /objectif » inchangés.
- L'état actif (`pathname === href`) se compare toujours sur le pathname seul.

## Cas limites

- Futur : `parseDateParam` clampe au jour courant ; la flèche suivante est
  masquée sur aujourd'hui ; l'`<input type="date">` a `max` = aujourd'hui.
- Param invalide / absent ⇒ aujourd'hui.
- Pas de limite dans le passé.
- Logger un jour passé crée le `Meal`/`ActivityEntry` à la bonne date (clé
  `userId_date_type` / date) — aucun conflit avec aujourd'hui.

## Tests (vitest)

`src/lib/__tests__/date.test.ts` :

- `parseDateParam` : date valide passée → ce jour ; date future → aujourd'hui ;
  chaîne invalide → aujourd'hui ; `undefined` → aujourd'hui.
- `addDays` : +1 / -1 / -30 (vérifier passage de mois).
- `toDateParam` : formate en `YYYY-MM-DD` (UTC).
- `isToday` : vrai pour aujourd'hui, faux pour un autre jour.

(Pages, composants client et actions : pas de harnais d'intégration dans le
projet ; vérification par `npx tsc --noEmit`, `npm test` et lancement de l'app.)

## Hors périmètre

- Navigation par jour sur Poids / Objectif.
- Swipe gestuel.
- Préchargement/cache des jours adjacents.
- Bilan hebdomadaire (chantier distinct).

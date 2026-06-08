# Scan code-barres — conception

Date : 2026-06-08
Statut : validé (conception)

## Objectif

Scanner le code-barres d'un produit emballé pour l'ajouter à un repas, avec ses
macros récupérées depuis OpenFoodFacts. Cible prioritaire : iPhone / Safari.

## Décisions

- **Décodage** : `@zxing/browser` (compatible iOS Safari), chargé dynamiquement
  à l'ouverture du scanner. Caméra arrière via `getUserMedia`.
- **Source macros** : OpenFoodFacts API v2 (lookup serveur, pas de CORS).
- **Flux** : aperçu nom + macros + quantité à confirmer avant ajout.
- **Emplacement** : bouton scan par repas, à côté de `MealInput`.
- **Saisie manuelle du code** disponible en secours (caméra refusée/indispo) et
  comme chemin testable sans caméra.
- **Modèle** : nouvelle valeur `FoodSource.openfoodfacts` ; référence clé-ée
  `off-<code-barres>`.
- **Quantité par défaut** : portion OFF (`serving_quantity`) si dispo, sinon 100 g.
- **Réutilisation** : l'action d'ajout par référence (récents) est renommée
  `addRecentFood` → `addFoodByReference` et partagée par récents et scan.

## OpenFoodFacts (`src/lib/openfoodfacts.ts`)

### `fetchOffProduct(code: string)`

`GET https://world.openfoodfacts.org/api/v2/product/<code>.json?fields=product_name,brands,nutriments,serving_quantity`
avec en-tête `User-Agent: macronaut/1.0`. Retourne le JSON parsé, ou `null` sur
erreur réseau / statut non 200.

### `mapOffProduct(json): ScanLookupResult` (pur, testé)

```ts
type ScanLookupResult =
  | { found: false }
  | { found: true; name: string; per100g: Per100g; servingG: number | null };
```

- `found: false` si `json.status !== 1` ou produit absent ou `product_name` vide.
- `name` : `product_name` (avec `brands` en préfixe si présent, ex « Danone — Yaourt »),
  tronqué/trim.
- `per100g` (depuis `nutriments`, manquant → 0) :
  `kcal` = `energy-kcal_100g`, `proteinG` = `proteins_100g`,
  `carbG` = `carbohydrates_100g`, `fatG` = `fat_100g`, `fiberG` = `fiber_100g`.
  Valeurs forcées en nombre fini ≥ 0 (sinon 0).
- `servingG` : `serving_quantity` (nombre) si fini et > 0, sinon `null`.

`Per100g` est le type existant de `src/lib/macros.ts`.

## Server action (`src/app/(app)/scan/actions.ts`)

### `lookupBarcode(code: string)`

```ts
type LookupState =
  | { ok: true; referenceId: string; name: string; per100g: Per100g; servingG: number | null }
  | { ok: false; error: string };
```

- Auth requise (`getCurrentUser`), sinon `{ ok:false, error:"Non authentifié." }`.
- Valide `code` (non vide, chiffres). Sinon `{ ok:false, error:"Code invalide." }`.
- `fetchOffProduct` + `mapOffProduct`. Si `found:false` →
  `{ ok:false, error:"Produit introuvable." }`.
- Sinon **upsert** `FoodReference` (`ciqualId = "off-" + code`, `name`, `...per100g`,
  `source: "openfoodfacts"`) et retourne
  `{ ok:true, referenceId, name, per100g, servingG }`.

Appelée directement (fonction server action importée) par le composant scanner.

### Ajout : réutilise `addFoodByReference`

`addRecentFood` (dans `src/app/(app)/actions.ts`) est renommée `addFoodByReference`
— signature et corps inchangés (`referenceId`, `mealType`, `quantityG`, champ
caché `date`). `RecentChips` met à jour son import. Le scanner soumet à cette
même action.

## Modèle de données

- `prisma/schema.prisma` : ajouter `openfoodfacts` à l'enum `FoodSource`.
- Migration Doctrine/Prisma : `prisma migrate dev --name add_openfoodfacts_source`
  (ajout de valeur d'enum, sans perte).
- `src/lib/meal.ts` : exclure les références `source === "openfoodfacts"` du pool
  de matching texte (les produits de marque ne doivent matcher que par code-barres) :
  la ligne `const pool = item.isGeneric ? refs : refs.filter(...)` filtre désormais
  aussi les OFF du cas générique.

## Composants

### `BarcodeScanner.tsx` (client)

Overlay plein écran, géré par un état `open`. Contenu :

1. **Caméra** : `<video>` alimenté par `getUserMedia({ video: { facingMode: "environment" } })`.
   `@zxing/browser` importé dynamiquement (`const { BrowserMultiFormatReader } = await import("@zxing/browser")`)
   au montage de l'overlay ; `decodeFromVideoDevice` → callback sur détection.
2. **Saisie manuelle** : champ texte « code-barres » + bouton, pour valider un code
   sans caméra (et secours si `getUserMedia` échoue → message + focus sur ce champ).
3. Sur code obtenu : appelle `lookupBarcode(code)`, affiche un état de chargement.
4. **Aperçu** : nom + macros/100 g + champ quantité (défaut `servingG ?? 100`) ;
   bouton « Ajouter » → `<form action={addFoodByReference}>` avec champs cachés
   `referenceId`, `mealType`, `date`, et `quantityG` issu du champ. Succès → ferme
   l'overlay (revalidation rafraîchit la Journée).
5. **Erreurs** : « Produit introuvable. » avec bouton « Réessayer » ; caméra refusée
   → bascule saisie manuelle.

Arrêt propre du flux caméra (`track.stop()`, reset du reader) à la fermeture.

### `MealScanButton.tsx` (client)

Bouton icône code-barres (lucide `ScanBarcode`/`Barcode`) rendu à côté de
`MealInput`. Props `{ mealType: string; date: string }`. Gère l'état d'ouverture et
rend `BarcodeScanner`.

### `page.tsx`

Rendre `<MealScanButton mealType={m.type} date={dateParam} />` dans chaque section
de repas, près de `MealInput`.

## Cas limites

- Produit introuvable dans OFF → message, retry ou fermeture.
- Caméra refusée / indisponible (non-HTTPS, pas de getUserMedia) → message +
  saisie manuelle du code.
- Macros absentes côté OFF → ajout avec 0 (corrigeable via ✎).
- Code illisible → le scan continue (pas d'ajout).
- Réutilisation d'un même produit → la référence `off-<code>` est upsert (idempotent).

## Tests (vitest)

`src/lib/__tests__/openfoodfacts.test.ts` couvrant `mapOffProduct` :

- Produit complet → `found:true`, nom avec marque, `per100g` correct, `servingG`.
- `status: 0` ou produit absent → `found:false`.
- Nutriments partiels (fibres manquantes) → champs absents = 0.
- `serving_quantity` absent/0 → `servingG: null`.
- Préfixe marque omis si `brands` vide.

`fetchOffProduct` (réseau), `lookupBarcode`/`addFoodByReference` (Prisma),
`BarcodeScanner` (caméra/zxing) : pas de harnais d'intégration → vérification
manuelle. Le chemin OFF + ajout est exerçable via la saisie manuelle du code (sans
caméra).

## Plan de construction (ordre conseillé)

1. Mapping OFF pur + tests.
2. Enum `FoodSource.openfoodfacts` + migration + exclusion dans `meal.ts`.
3. Rename `addRecentFood` → `addFoodByReference` (+ usage `RecentChips`).
4. `lookupBarcode` (fetch + upsert).
5. `BarcodeScanner` **avec saisie manuelle d'abord** (chemin testable sans caméra),
   puis couche caméra zxing.
6. `MealScanButton` + câblage `page.tsx`.

## Hors périmètre

- Scan en rafale (multi-produits).
- Choix du repas depuis un bouton global (on reste par repas).
- Cache local des produits scannés au-delà de la table `FoodReference`.
- Photo du produit, Nutri-Score, autres champs OFF.

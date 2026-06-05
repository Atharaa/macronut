# Macronaut — Design

Date : 2026-06-05
Statut : design validé, en attente de revue utilisateur

## Objectif

Application web personnelle de gestion de l'alimentation. L'utilisateur saisit son profil et son objectif (perte / prise / maintien), l'app calcule ses besoins en énergie et macronutriments, suit son évolution (poids, activité, repas) et estime le temps pour atteindre l'objectif.

Usage : **personnel** (un seul utilisateur), **PWA hébergée**, **mobile-first** (adaptée desktop).

## Stack technique

- **Next.js** (App Router, TypeScript) — une seule application front + back.
- **PWA** : manifest + service worker, installable sur mobile.
- **API routes** côté serveur pour les appels IA → la clé Anthropic ne quitte jamais le serveur.
- **Postgres** (Neon, free tier) + **Prisma** (ORM, migrations).
- **NextAuth** (credentials, un seul utilisateur) pour protéger l'URL publique.
- Déploiement : **Vercel**.
- UI : Tailwind CSS, design moderne, mobile-first, thème clair/sombre.

## IA — découpage des repas

- Modèle : **Claude Haiku 4.5** (`claude-haiku-4-5`) — meilleur rapport qualité/prix pour de l'extraction structurée. Coût négligeable en usage perso (quelques requêtes/jour).
- Technique : **structured outputs** (`output_config.format` avec un JSON schema) pour garantir un JSON valide.
- Rôle de l'IA : transformer un message en langage naturel (« 150 g de poulet grillé et 200 g de riz ») en liste d'aliments + quantités normalisées. **L'IA n'invente pas les valeurs nutritionnelles** — elle ne fait que le découpage.
- Repli : si le découpage déçoit, passer à `claude-sonnet-4-6` sans changer le code (seul l'ID de modèle change).
- SDK : `@anthropic-ai/sdk` (TypeScript), appel depuis une API route.

## Base nutritionnelle

- **CIQUAL** (table de composition nutritionnelle officielle ANSES, française, gratuite) importée en base au seed.
- Noms d'aliments en français, valeurs fiables (kcal, protéines, glucides, lipides, fibres pour 100 g).
- Flux : IA découpe → recherche de l'aliment dans CIQUAL (matching textuel, fuzzy si besoin) → calcul des valeurs selon la quantité.
- Si un aliment n'est pas trouvé : proposer à l'utilisateur de choisir/confirmer l'aliment dans la liste.

## Modèle de données (Prisma)

- **User** : `sex`, `birthDate`, `heightCm`, credentials d'auth.
- **Goal** : `type` (`loss` | `gain` | `maintain`), `targetKg` (kg à perdre/prendre, null si maintien), `weeklyRateKg` (rythme), `startDate`, + objectifs calculés stockés (`targetKcal`, `targetProteinG`, `targetCarbG`, `targetFatG`, `targetFiberG`), `activityLevel`.
- **WeightEntry** : `date`, `weightKg` (saisie hebdomadaire) → graphique d'évolution.
- **ActivityEntry** : `date`, `type` (`sport` | `steps`), `value`, `estimatedKcal`.
- **Meal** : `date`, `type` (`breakfast` | `morning_snack` | `lunch` | `afternoon_snack` | `dinner`).
- **FoodItem** : rattaché à un `Meal` — `name`, `quantityG`, `kcal`, `proteinG`, `carbG`, `fatG`, `fiberG`, lien optionnel vers `FoodReference`.
- **FoodReference** : entrée CIQUAL — `name`, valeurs pour 100 g.

## Calculs

- **Métabolisme de base (MB)** : formule **Mifflin-St Jeor**.
  - Homme : `10·poids + 6,25·taille − 5·âge + 5`
  - Femme : `10·poids + 6,25·taille − 5·âge − 161`
- **Dépense totale (TDEE)** = MB × facteur d'activité de base (sédentaire → très actif), **+ bonus du jour** issu de l'activité saisie (sport, pas).
- **Objectif kcal** = TDEE − déficit (perte) ou + surplus (prise). Déficit/surplus dérivé du rythme voulu : `(weeklyRateKg × 7 700) / 7` kcal/jour. Maintien : objectif = TDEE.
- **Macros** :
  - Protéines : ~1,8 g/kg de poids.
  - Lipides : ~0,8 g/kg de poids.
  - Glucides : reste des kcal.
  - Fibres : ~14 g par 1 000 kcal.
- **Estimation du temps** = `targetKg / weeklyRateKg` (semaines), affinée par la tendance réelle du graphique de poids.
- **Restant du jour** = objectif − somme des repas saisis (+ ajustement activité du jour), par kcal et par macro.

## Écrans (navigation basse, 4 onglets)

1. **Journée** (écran principal — voir maquette `daily-screen.html`)
   - Bandeau haut : kcal restantes + 4 macros restantes (prot./gluc./lip./fibres) vs objectif du jour.
   - 5 cartes repas. Chacune : liste des aliments (nom, quantité, kcal), résumé macro du repas, champ de saisie en langage naturel + bouton ajouter.
   - Ajout : saisie texte → IA → CIQUAL → items ajoutés (confirmation si aliment ambigu).
2. **Poids** : saisie hebdo + graphique d'évolution (courbe poids réel vs trajectoire cible).
3. **Activité** : saisie quotidienne (sport, nombre de pas) + dépense estimée.
4. **Objectif** : profil (sexe, âge, taille, poids), objectif (type + valeur + rythme), niveau d'activité, besoins calculés affichés, estimation du temps pour atteindre l'objectif.

## Gestion des erreurs

- Appel IA en échec / timeout : message clair, possibilité de re-saisir ou d'ajouter manuellement.
- Aliment introuvable dans CIQUAL : sélection/confirmation manuelle dans la liste.
- JSON IA invalide : garanti par structured outputs ; en dernier recours, fallback saisie manuelle.
- Validations de saisie (poids, quantités) côté client et serveur (zod).

## Tests

- Unitaires sur les calculs (MB, TDEE, objectif kcal, macros, estimation temps) — purs, faciles à tester.
- Unitaires sur le parsing/matching CIQUAL.
- Mock de l'appel IA (pas d'appel réseau en test) — vérifier le mapping découpage → items.
- Tests d'intégration sur les API routes principales (ajout repas, saisie poids/activité).

## Hors périmètre (YAGNI)

- Multi-utilisateurs, partage social.
- Scan de code-barres, photos d'aliments.
- Application native (PWA suffit).
- Recommandations de recettes.

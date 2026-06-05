# Macronaut

Application web personnelle de suivi nutritionnel (PWA, mobile-first).

Saisis ton profil et ton objectif (perte / prise / maintien) : l'app calcule tes besoins
en énergie et macronutriments, suit ton poids et ton activité, et te laisse enregistrer tes
repas en **langage naturel** — l'IA découpe le message en aliments + quantités, valorisés
via la table nutritionnelle CIQUAL.

## Stack

- **Next.js 15** (App Router, TypeScript), **Tailwind CSS v4** — PWA installable
- **Prisma** + **PostgreSQL**
- **NextAuth v5** (mono-utilisateur, credentials)
- **Anthropic API** (`claude-haiku-4-5`, structured outputs) pour le découpage des repas
- Base nutritionnelle **CIQUAL 2020** (ANSES)
- **Vitest** pour les tests

## Fonctionnalités

- **Objectif** : profil + objectif → besoins kcal & macros (Mifflin-St Jeor → TDEE → objectif), estimation du temps
- **Journée** : restant du jour (kcal + macros, + bonus activité) et 5 repas avec saisie en langage naturel
- **Poids** : saisie + graphique d'évolution
- **Activité** : sport / pas → dépense estimée
- Aliment inconnu → estimé par l'IA et ajouté en base, ou corrigeable à la main

## Démarrage

### 1. Base de données

PostgreSQL (Neon en prod, ou conteneur local) :

```bash
docker run --name macronaut-pg -e POSTGRES_PASSWORD=macronaut -e POSTGRES_DB=macronaut -p 5433:5432 -d postgres:16
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Renseigner DATABASE_URL, AUTH_SECRET (openssl rand -base64 32),
# SEED_USER_EMAIL / SEED_USER_PASSWORD, ANTHROPIC_API_KEY
```

### 3. Schéma + utilisateur + aliments de base

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

### 4. Import de la table CIQUAL complète (optionnel mais recommandé)

```bash
mkdir -p prisma/data
curl -sL -o prisma/data/ciqual.xls "https://www.data.gouv.fr/api/1/datasets/r/bcdb7fec-875c-42aa-ba6e-460adf97aad3"
npm run import:ciqual
```

### 5. Lancer

```bash
npm run dev
```

Connexion avec les identifiants définis dans `.env` (`SEED_USER_*`).

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm test` | Tests unitaires (Vitest) |
| `npm run import:ciqual` | Import de la table CIQUAL |

## Données

La table CIQUAL provient de l'[ANSES](https://www.anses.fr/en/content/ciqual-nutritional-composition-table)
([data.gouv.fr](https://www.data.gouv.fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual-2020)).
Le fichier source `prisma/data/ciqual.xls` n'est pas versionné (re-téléchargeable, cf. ci-dessus).

# Macronaut — Plan 1 : Fondations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le squelette de l'application (Next.js + Tailwind + Prisma/Postgres + NextAuth + PWA + navigation) sur lequel les fonctionnalités viendront se greffer.

**Architecture:** Application Next.js unique (App Router, TypeScript). Front et back dans le même projet ; les appels sensibles passent par des API routes. Base Postgres via Prisma. Authentification mono-utilisateur via NextAuth (credentials). PWA installable. Navigation basse à 4 onglets.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma 6, PostgreSQL (Neon), NextAuth v5 (Auth.js), Vitest, zod, bcrypt.

---

## Prérequis d'environnement

- **Node.js ≥ 20** requis. Vérifier : `node -v`. Si Node n'est pas dispo localement, lancer les commandes dans un conteneur : `docker run --rm -it -v "$PWD":/app -w /app node:20 <commande>`.
- **Postgres** : créer une base gratuite sur [neon.tech](https://neon.tech), récupérer la `DATABASE_URL`. Pour le dev local sans cloud, un conteneur : `docker run --name macronaut-pg -e POSTGRES_PASSWORD=macronaut -e POSTGRES_DB=macronaut -p 5432:5432 -d postgres:16` → `DATABASE_URL="postgresql://postgres:macronaut@localhost:5432/macronaut"`.
- Le projet existe déjà dans `/Users/cpetit/Desktop/Projects/macronaut` (git initialisé, dossier `docs/`). Les commandes ci-dessous s'exécutent depuis cette racine.

## Structure de fichiers cible (fin du plan 1)

- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` — config projet.
- `vitest.config.ts`, `vitest.setup.ts` — tests.
- `.env`, `.env.example` — variables d'environnement.
- `prisma/schema.prisma` — modèle de données complet.
- `prisma/seed.ts` — création de l'utilisateur unique.
- `src/lib/prisma.ts` — client Prisma singleton.
- `src/lib/auth.ts` — config NextAuth.
- `src/middleware.ts` — protection des routes.
- `src/app/layout.tsx`, `src/app/globals.css` — layout racine.
- `src/app/(app)/layout.tsx` — layout authentifié + navigation basse.
- `src/app/(app)/page.tsx` (Journée), `src/app/(app)/poids/page.tsx`, `src/app/(app)/activite/page.tsx`, `src/app/(app)/objectif/page.tsx` — pages placeholder.
- `src/app/login/page.tsx` — page de connexion.
- `src/app/api/auth/[...nextauth]/route.ts` — handler NextAuth.
- `src/components/BottomNav.tsx` — barre de navigation.
- `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png` — PWA.

---

### Task 1 : Scaffolder le projet Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/*` (générés)

- [ ] **Step 1 : Générer le projet dans le dossier courant**

Le dossier `macronaut` contient déjà `docs/` et `.git`. Générer Next.js dedans :

```bash
cd /Users/cpetit/Desktop/Projects/macronaut
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
```

Répondre `Yes` si demandé pour continuer dans un dossier non vide (il conserve `docs/` et `.git`).

- [ ] **Step 2 : Vérifier que le projet démarre**

Run: `npm run dev`
Expected: serveur sur `http://localhost:3000`, page d'accueil Next.js affichée. Arrêter avec Ctrl+C.

- [ ] **Step 3 : Nettoyer la page d'accueil par défaut**

Remplacer le contenu de `src/app/page.tsx` par :

```tsx
export default function Home() {
  return <main className="p-8">Macronaut</main>;
}
```

Vider `src/app/globals.css` de tout sauf les directives Tailwind :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4 : Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and TypeScript"
```

---

### Task 2 : Mettre en place Vitest

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `src/lib/__tests__/smoke.test.ts`
- Modify: `package.json`

- [ ] **Step 1 : Installer les dépendances de test**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2 : Écrire `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3 : Écrire `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4 : Ajouter le script de test dans `package.json`**

Dans la section `"scripts"`, ajouter :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5 : Écrire un test smoke (échoue d'abord)**

Create `src/lib/__tests__/smoke.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { ping } from "@/lib/ping";

describe("ping", () => {
  it("returns pong", () => {
    expect(ping()).toBe("pong");
  });
});
```

- [ ] **Step 6 : Lancer le test pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/ping'`.

- [ ] **Step 7 : Implémenter `src/lib/ping.ts`**

```ts
export function ping(): string {
  return "pong";
}
```

- [ ] **Step 8 : Lancer le test pour vérifier le succès**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 9 : Commit**

```bash
git add -A
git commit -m "test: set up Vitest with a smoke test"
```

---

### Task 3 : Variables d'environnement

**Files:**
- Create: `.env`, `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1 : Vérifier que `.env` est ignoré**

`.gitignore` (généré par create-next-app) contient déjà `.env*`. Vérifier : `grep -n "env" .gitignore`. Si absent, ajouter une ligne `.env*`.

- [ ] **Step 2 : Écrire `.env.example`**

```bash
# Base de données Postgres (Neon ou local)
DATABASE_URL="postgresql://user:password@host:5432/macronaut"

# NextAuth
AUTH_SECRET="genere-moi-avec: openssl rand -base64 32"

# Utilisateur unique (seed)
SEED_USER_EMAIL="moi@example.com"
SEED_USER_PASSWORD="changeme"

# Anthropic (utilisé au plan 4)
ANTHROPIC_API_KEY=""
```

- [ ] **Step 3 : Créer `.env` à partir de l'exemple**

```bash
cp .env.example .env
```

Renseigner `DATABASE_URL` (Neon ou conteneur local) et générer le secret :

```bash
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
```

Éditer `.env` pour mettre un vrai email/mot de passe de seed et supprimer la ligne `AUTH_SECRET` en doublon (garder celle générée).

- [ ] **Step 4 : Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment variable template"
```

---

### Task 4 : Schéma Prisma et migration

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Modify: `package.json`

- [ ] **Step 1 : Installer Prisma**

```bash
npm install prisma @prisma/client
npm install -D tsx
npx prisma init --datasource-provider postgresql
```

`prisma init` crée `prisma/schema.prisma` et ajoute `DATABASE_URL` à `.env` (le doublon est inoffensif, garder la valeur renseignée à la Task 3).

- [ ] **Step 2 : Écrire le schéma complet dans `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Sex {
  male
  female
}

enum GoalType {
  loss
  gain
  maintain
}

enum ActivityLevel {
  sedentary
  light
  moderate
  active
  very_active
}

enum MealType {
  breakfast
  morning_snack
  lunch
  afternoon_snack
  dinner
}

enum ActivityType {
  sport
  steps
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  sex          Sex?
  birthDate    DateTime?
  heightCm     Float?
  createdAt    DateTime @default(now())

  goal           Goal?
  weightEntries  WeightEntry[]
  activityEntries ActivityEntry[]
  meals          Meal[]
}

model Goal {
  id             String        @id @default(cuid())
  userId         String        @unique
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  type           GoalType
  targetKg       Float?
  weeklyRateKg   Float?
  activityLevel  ActivityLevel @default(sedentary)
  startDate      DateTime      @default(now())
  targetKcal     Int?
  targetProteinG Int?
  targetCarbG    Int?
  targetFatG     Int?
  targetFiberG   Int?
  updatedAt      DateTime      @updatedAt
}

model WeightEntry {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date     DateTime
  weightKg Float

  @@unique([userId, date])
  @@index([userId, date])
}

model ActivityEntry {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  date          DateTime
  type          ActivityType
  value         Float
  estimatedKcal Int

  @@index([userId, date])
}

model Meal {
  id     String   @id @default(cuid())
  userId String
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date   DateTime
  type   MealType
  items  FoodItem[]

  @@unique([userId, date, type])
  @@index([userId, date])
}

model FoodItem {
  id          String         @id @default(cuid())
  mealId      String
  meal        Meal           @relation(fields: [mealId], references: [id], onDelete: Cascade)
  referenceId String?
  reference   FoodReference? @relation(fields: [referenceId], references: [id])
  name        String
  quantityG   Float
  kcal        Float
  proteinG    Float
  carbG       Float
  fatG        Float
  fiberG      Float
}

model FoodReference {
  id        String     @id @default(cuid())
  ciqualId  String     @unique
  name      String
  kcal      Float
  proteinG  Float
  carbG     Float
  fatG      Float
  fiberG    Float
  items     FoodItem[]

  @@index([name])
}
```

- [ ] **Step 3 : Créer la migration et générer le client**

Run: `npx prisma migrate dev --name init`
Expected: migration `init` créée dans `prisma/migrations/`, client Prisma généré, message « Your database is now in sync ».

- [ ] **Step 4 : Écrire le client singleton `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema and initial migration"
```

---

### Task 5 : Seed de l'utilisateur unique

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1 : Installer bcrypt**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2 : Écrire `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_USER_EMAIL et SEED_USER_PASSWORD doivent être définis");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });
  console.log(`Utilisateur ${email} prêt.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 3 : Déclarer la commande de seed dans `package.json`**

Ajouter à la racine du `package.json` :

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4 : Lancer le seed**

Run: `npx prisma db seed`
Expected: « Utilisateur <email> prêt. »

- [ ] **Step 5 : Vérifier en base**

Run: `npx prisma studio`
Expected: Prisma Studio s'ouvre, la table `User` contient une ligne. Fermer.

- [ ] **Step 6 : Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: seed single user with hashed password"
```

---

### Task 6 : Authentification NextAuth (credentials)

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`, `src/app/login/actions.ts`
- Test: `src/lib/__tests__/auth-config.test.ts`

- [ ] **Step 1 : Installer NextAuth v5**

```bash
npm install next-auth@beta
```

- [ ] **Step 2 : Écrire la config `src/lib/auth.ts`**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
});
```

- [ ] **Step 3 : Écrire le handler `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4 : Écrire le test de présence des exports (échoue d'abord)**

Create `src/lib/__tests__/auth-config.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import * as authModule from "@/lib/auth";

describe("auth config", () => {
  it("exporte handlers, auth, signIn, signOut", () => {
    expect(authModule.handlers).toBeDefined();
    expect(typeof authModule.auth).toBe("function");
    expect(typeof authModule.signIn).toBe("function");
    expect(typeof authModule.signOut).toBe("function");
  });
});
```

- [ ] **Step 5 : Lancer le test**

Run: `npm test src/lib/__tests__/auth-config.test.ts`
Expected: PASS (les exports existent déjà après le Step 2).

- [ ] **Step 6 : Écrire l'action serveur de login `src/app/login/actions.ts`**

```ts
"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(_prev: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Identifiants invalides.";
    throw error;
  }
}
```

- [ ] **Step 7 : Écrire la page de login `src/app/login/page.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Macronaut</h1>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border p-3"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mot de passe"
          className="w-full rounded-lg border p-3"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-green-600 p-3 font-medium text-white disabled:opacity-60"
        >
          Se connecter
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 8 : Vérifier la connexion manuellement**

Run: `npm run dev` puis ouvrir `http://localhost:3000/login`. Se connecter avec l'email/mot de passe du seed.
Expected: redirection vers `/` sans erreur. Mauvais mot de passe → message « Identifiants invalides. ». Arrêter le serveur.

- [ ] **Step 9 : Commit**

```bash
git add -A
git commit -m "feat: add NextAuth credentials authentication"
```

---

### Task 7 : Protection des routes (middleware)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1 : Écrire `src/middleware.ts`**

```ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!isLoggedIn && !isLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLogin) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-.*\\.png).*)"],
};
```

- [ ] **Step 2 : Vérifier la protection**

Run: `npm run dev`, ouvrir `http://localhost:3000/` en navigation privée (déconnecté).
Expected: redirection automatique vers `/login`. Après connexion, accès à `/`. Arrêter le serveur.

- [ ] **Step 3 : Commit**

```bash
git add src/middleware.ts
git commit -m "feat: protect routes with auth middleware"
```

---

### Task 8 : Layout authentifié et navigation basse

**Files:**
- Create: `src/components/BottomNav.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/poids/page.tsx`, `src/app/(app)/activite/page.tsx`, `src/app/(app)/objectif/page.tsx`
- Delete: `src/app/page.tsx`
- Test: `src/components/__tests__/BottomNav.test.tsx`

- [ ] **Step 1 : Supprimer l'ancienne page racine**

```bash
rm src/app/page.tsx
```

(La nouvelle page Journée vivra dans le groupe `(app)`.)

- [ ] **Step 2 : Écrire le test de `BottomNav` (échoue d'abord)**

Create `src/components/__tests__/BottomNav.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/BottomNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("BottomNav", () => {
  it("affiche les 4 onglets", () => {
    render(<BottomNav />);
    expect(screen.getByText("Journée")).toBeInTheDocument();
    expect(screen.getByText("Poids")).toBeInTheDocument();
    expect(screen.getByText("Activité")).toBeInTheDocument();
    expect(screen.getByText("Objectif")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3 : Lancer le test pour vérifier l'échec**

Run: `npm test src/components/__tests__/BottomNav.test.tsx`
Expected: FAIL — `Cannot find module '@/components/BottomNav'`.

- [ ] **Step 4 : Implémenter `src/components/BottomNav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Journée", icon: "📋" },
  { href: "/poids", label: "Poids", icon: "📈" },
  { href: "/activite", label: "Activité", icon: "🏃" },
  { href: "/objectif", label: "Objectif", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t bg-white py-2 dark:bg-neutral-900">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center text-xs ${
              active ? "text-green-600" : "text-neutral-500"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5 : Lancer le test pour vérifier le succès**

Run: `npm test src/components/__tests__/BottomNav.test.tsx`
Expected: PASS.

- [ ] **Step 6 : Écrire le layout `src/app/(app)/layout.tsx`**

```tsx
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 7 : Écrire les 4 pages placeholder**

Create `src/app/(app)/page.tsx` :

```tsx
export default function JourneePage() {
  return <main className="p-4 text-xl font-semibold">Journée</main>;
}
```

Create `src/app/(app)/poids/page.tsx` :

```tsx
export default function PoidsPage() {
  return <main className="p-4 text-xl font-semibold">Poids</main>;
}
```

Create `src/app/(app)/activite/page.tsx` :

```tsx
export default function ActivitePage() {
  return <main className="p-4 text-xl font-semibold">Activité</main>;
}
```

Create `src/app/(app)/objectif/page.tsx` :

```tsx
export default function ObjectifPage() {
  return <main className="p-4 text-xl font-semibold">Objectif</main>;
}
```

- [ ] **Step 8 : Vérifier la navigation**

Run: `npm run dev`, se connecter, naviguer entre les 4 onglets.
Expected: chaque onglet affiche sa page, l'onglet actif est en vert. Arrêter le serveur.

- [ ] **Step 9 : Commit**

```bash
git add -A
git commit -m "feat: add app layout with bottom navigation and placeholder pages"
```

---

### Task 9 : PWA (manifest + icônes + métadonnées)

**Files:**
- Create: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1 : Écrire `public/manifest.webmanifest`**

```json
{
  "name": "Macronaut",
  "short_name": "Macronaut",
  "description": "Suivi nutritionnel personnel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1115",
  "theme_color": "#16a34a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2 : Générer deux icônes vertes simples**

Si ImageMagick est dispo :

```bash
magick -size 192x192 xc:'#16a34a' public/icon-192.png
magick -size 512x512 xc:'#16a34a' public/icon-512.png
```

Sinon, déposer manuellement deux PNG (192×192 et 512×512) dans `public/`. Vérifier : `ls -la public/icon-*.png`.

- [ ] **Step 3 : Lier le manifest dans `src/app/layout.tsx`**

Remplacer l'objet `metadata` exporté et ajouter `viewport` :

```tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Macronaut",
  description: "Suivi nutritionnel personnel",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
```

Vérifier que la balise `<html lang="fr">` est utilisée (remplacer `lang="en"` si besoin).

- [ ] **Step 4 : Vérifier le manifest**

Run: `npm run dev`, ouvrir les DevTools → onglet Application → Manifest.
Expected: Macronaut détecté, icônes affichées, pas d'erreur. Arrêter le serveur.

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest and icons"
```

---

### Task 10 : Vérification finale du plan 1

- [ ] **Step 1 : Lancer toute la suite de tests**

Run: `npm test`
Expected: tous les tests passent (smoke, auth-config, BottomNav).

- [ ] **Step 2 : Vérifier le build de production**

Run: `npm run build`
Expected: build réussi sans erreur TypeScript.

- [ ] **Step 3 : Commit final si des ajustements ont été faits**

```bash
git add -A
git commit -m "chore: foundations complete" --allow-empty
```

---

## Auto-revue (couverture de la spec, plan 1)

- Stack Next.js + Tailwind + TS : Tasks 1–2. ✓
- Postgres + Prisma + modèle de données complet (toutes les entités de la spec) : Task 4. ✓
- Auth mono-utilisateur (NextAuth credentials + seed) : Tasks 5–6. ✓
- Protection de l'URL publique : Task 7. ✓
- PWA installable (manifest + icônes + thème) : Task 9. ✓
- Navigation basse 4 onglets + pages placeholder : Task 8. ✓
- Calculs, CIQUAL, IA, repas, poids, activité : **hors périmètre plan 1**, couverts par les plans 2 à 5.

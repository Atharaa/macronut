"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login } from "./actions";

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:focus:bg-neutral-900";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/icon-192.png" alt="" width={64} height={64} className="rounded-2xl shadow-md" priority />
          <h1 className="mt-3 text-2xl font-bold text-neutral-800 dark:text-neutral-100">Macronaut</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Ton suivi nutritionnel</p>
        </div>

        <form action={formAction} className="space-y-3 rounded-3xl bg-white p-6 shadow-xl shadow-emerald-500/5 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
          <input name="email" type="email" required placeholder="Email" className={inputCls} />
          <input name="password" type="password" required placeholder="Mot de passe" className={inputCls} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 font-semibold text-white shadow-md shadow-emerald-500/25 disabled:opacity-60"
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}

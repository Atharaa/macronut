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

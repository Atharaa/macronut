"use client";

import { useActionState } from "react";
import { saveProfile, type ObjectifState } from "@/app/(app)/objectif/actions";

export interface ObjectifFormValues {
  sex: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  activityLevel: string;
  goalType: string;
  targetKg: string;
  weeklyRateKg: string;
}

const labelCls = "block text-sm font-medium text-neutral-600 dark:text-neutral-300";
const inputCls = "mt-1 w-full rounded-lg border p-2.5 bg-transparent";

export function ObjectifForm({ initial }: { initial: ObjectifFormValues }) {
  const [state, formAction, pending] = useActionState<ObjectifState | undefined, FormData>(
    saveProfile,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Sexe</label>
          <select name="sex" defaultValue={initial.sex} className={inputCls}>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Date de naissance</label>
          <input type="date" name="birthDate" defaultValue={initial.birthDate} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Taille (cm)</label>
          <input type="number" name="heightCm" step="0.1" defaultValue={initial.heightCm} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Poids actuel (kg)</label>
          <input type="number" name="weightKg" step="0.1" defaultValue={initial.weightKg} required className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Niveau d'activité</label>
        <select name="activityLevel" defaultValue={initial.activityLevel} className={inputCls}>
          <option value="sedentary">Sédentaire</option>
          <option value="light">Légèrement actif</option>
          <option value="moderate">Modérément actif</option>
          <option value="active">Actif</option>
          <option value="very_active">Très actif</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Objectif</label>
        <select name="goalType" defaultValue={initial.goalType} className={inputCls}>
          <option value="loss">Perte</option>
          <option value="gain">Prise</option>
          <option value="maintain">Maintien</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Objectif (kg à perdre/prendre)</label>
          <input type="number" name="targetKg" step="0.1" defaultValue={initial.targetKg} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Rythme (kg / semaine)</label>
          <input type="number" name="weeklyRateKg" step="0.05" defaultValue={initial.weeklyRateKg} className={inputCls} />
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Laisse les deux derniers champs vides en maintien.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Profil enregistré.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green-600 p-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
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
  leanMassKg: string;
}

const inputCls =
  "mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-neutral-500";

function Segment({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="relative">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="block cursor-pointer rounded-lg py-2 text-center text-sm font-medium text-neutral-500 peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
        {label}
      </span>
    </label>
  );
}

export function ObjectifForm({ initial }: { initial: ObjectifFormValues }) {
  const [state, formAction, pending] = useActionState<ObjectifState | undefined, FormData>(
    saveProfile,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Profil */}
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
        <h2 className="text-sm font-bold text-neutral-800">Profil</h2>

        <div>
          <span className={labelCls}>Sexe</span>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
            <Segment name="sex" value="male" label="Homme" defaultChecked={initial.sex !== "female"} />
            <Segment name="sex" value="female" label="Femme" defaultChecked={initial.sex === "female"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>Naissance</span>
            <input type="date" name="birthDate" defaultValue={initial.birthDate} required className={inputCls} />
          </div>
          <div>
            <span className={labelCls}>Taille (cm)</span>
            <input type="number" name="heightCm" step="0.1" defaultValue={initial.heightCm} required className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>Poids actuel (kg)</span>
            <input type="number" name="weightKg" step="0.1" defaultValue={initial.weightKg} required className={inputCls} />
          </div>
          <div>
            <span className={labelCls}>Masse sèche (kg)</span>
            <input type="number" name="leanMassKg" step="0.1" defaultValue={initial.leanMassKg} placeholder="optionnel" className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          Masse sèche = poids hors graisse. Si renseignée, les protéines visent 2 g/kg de masse sèche (sinon 1,8 g/kg du poids).
        </p>
      </section>

      {/* Objectif */}
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
        <h2 className="text-sm font-bold text-neutral-800">Objectif</h2>

        <div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
            <Segment name="goalType" value="loss" label="Perte" defaultChecked={initial.goalType === "loss"} />
            <Segment name="goalType" value="maintain" label="Maintien" defaultChecked={initial.goalType === "maintain" || !initial.goalType} />
            <Segment name="goalType" value="gain" label="Prise" defaultChecked={initial.goalType === "gain"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>Objectif (kg)</span>
            <input type="number" name="targetKg" step="0.1" defaultValue={initial.targetKg} placeholder="—" className={inputCls} />
          </div>
          <div>
            <span className={labelCls}>Rythme (kg/sem.)</span>
            <input type="number" name="weeklyRateKg" step="0.05" defaultValue={initial.weeklyRateKg} placeholder="—" className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">Laisse ces deux champs vides en maintien.</p>

        <div>
          <span className={labelCls}>Niveau d'activité</span>
          <select name="activityLevel" defaultValue={initial.activityLevel} className={inputCls}>
            <option value="sedentary">Sédentaire</option>
            <option value="light">Légèrement actif</option>
            <option value="moderate">Modérément actif</option>
            <option value="active">Actif</option>
            <option value="very_active">Très actif</option>
          </select>
        </div>
      </section>

      {state?.error && <p className="px-1 text-sm text-rose-600">{state.error}</p>}
      {state?.ok && (
        <p className="flex items-center gap-1 px-1 text-sm text-emerald-600">
          <Check size={15} /> Profil enregistré.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 font-semibold text-white shadow-md shadow-emerald-500/25 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, TrendingUp, Flame, Target, type LucideIcon } from "lucide-react";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Journée", icon: CalendarDays },
  { href: "/poids", label: "Poids", icon: TrendingUp },
  { href: "/activite", label: "Activité", icon: Flame },
  { href: "/objectif", label: "Objectif", icon: Target },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-neutral-200/70 bg-white/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium ${
              active ? "text-emerald-600" : "text-neutral-400"
            }`}
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                active ? "bg-emerald-100" : "bg-transparent"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

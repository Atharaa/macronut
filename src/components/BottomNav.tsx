"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, TrendingUp, Flame, Target, type LucideIcon } from "lucide-react";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Journée", icon: CalendarDays },
  { href: "/poids", label: "Poids", icon: TrendingUp },
  { href: "/activite", label: "Activité", icon: Flame },
  { href: "/objectif", label: "Objectif", icon: Target },
];

function TabContent({ active, label, Icon }: { active: boolean; label: string; Icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  const highlight = active || pending;
  return (
    <span
      className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium ${
        highlight ? "text-emerald-600" : "text-neutral-400"
      }`}
    >
      <span
        className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
          highlight ? "bg-emerald-100" : "bg-transparent"
        } ${pending ? "animate-pulse" : ""}`}
      >
        <Icon size={20} strokeWidth={highlight ? 2.4 : 2} />
      </span>
      {label}
    </span>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-neutral-200/70 bg-white/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} prefetch className="flex flex-1 justify-center">
          <TabContent active={pathname === href} label={label} Icon={Icon} />
        </Link>
      ))}
    </nav>
  );
}

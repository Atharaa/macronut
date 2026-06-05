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
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t bg-white py-2 dark:bg-neutral-900">
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

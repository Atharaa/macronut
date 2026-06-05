import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Utilisateur courant (mono-utilisateur) avec son objectif, ou null si non connecté. */
export async function getCurrentUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email },
    include: { goal: true },
  });
}

/** Dernière pesée enregistrée pour un utilisateur, ou null. */
export async function getLatestWeight(userId: string) {
  return prisma.weightEntry.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

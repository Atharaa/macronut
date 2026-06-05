import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STARTER_FOODS } from "./foods-starter";

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

  for (const food of STARTER_FOODS) {
    await prisma.foodReference.upsert({
      where: { ciqualId: food.ciqualId },
      update: { ...food },
      create: { ...food },
    });
  }
  console.log(`${STARTER_FOODS.length} aliments de référence chargés.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

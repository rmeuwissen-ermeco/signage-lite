import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Voeg een testrecord toe
  await prisma.test.create({
    data: { name: "Eerste record" },
  });

  // Lees alles terug
  const all = await prisma.test.findMany();
  console.log(all);
}

main()
  .then(() => {
    console.log("Klaar!");
  })
  .catch((e) => {
    console.error("Fout in prisma-test:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


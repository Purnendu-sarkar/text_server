import { prisma } from "./lib/prisma";

async function main() {
  const result = await prisma.$queryRaw`SELECT now()`;
  console.log("DB Connected Successfully:", result);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });

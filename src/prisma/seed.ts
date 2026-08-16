import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123456", 10);
  const viewerHash = await bcrypt.hash("viewer123456", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      passwordHash: adminHash,
      role: "ADMIN",
      displayName: "Default Admin",
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { username: "viewer" },
    create: {
      username: "viewer",
      passwordHash: viewerHash,
      role: "VIEWER",
      displayName: "Default Viewer",
    },
    update: {},
  });

  console.log("[seed] admin / viewer users ready");
  console.log("[seed] change passwords after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

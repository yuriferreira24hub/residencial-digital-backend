import { prisma } from "../src/utils/prisma";
import bcrypt from "bcrypt";

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      name: "admin",
      email: "admin@test.com",
      passwordHash,
      role: "admin"
    }
  });

  console.log("Admin criado com sucesso!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

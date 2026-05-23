import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ControlGuard2026!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'auditor@example.com' },
    update: {},
    create: {
      email: 'auditor@example.com',
      username: 'auditor',
      passwordHash,
    },
  });

  console.log('Seeded user:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ControlGuard2026!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'auditor@example.com' },
    update: {},
    create: { email: 'auditor@example.com', username: 'auditor', passwordHash },
  });
  console.log('Seeded user:', user.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

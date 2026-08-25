import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.environment.createMany({
    data: [{ name: 'Maritim' }, { name: 'Land' }, { name: 'Kyst' }],
    skipDuplicates: true,
  });

  await prisma.taskType.createMany({
    data: [
      { code: 'OBSERVATION', name: 'Observation' },
      { code: 'QUIZ', name: 'Quiz' },
      { code: 'PROCEDURE', name: 'Procedureøvelse' },
      { code: 'CHECKLIST', name: 'Tjekliste' },
      { code: 'EMERGENCY', name: 'Nødsituation' },
    ],
    skipDuplicates: true,
  });
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD is not configured');
  }
  const passwordHash = await argon2.hash(adminPassword);

  await prisma.user.upsert({
    where: {
      username: 'admin',
    },
    update: {},
    create: {
      username: 'admin',
      displayName: 'Development Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('Seed data inserted');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

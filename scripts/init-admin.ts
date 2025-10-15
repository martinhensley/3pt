import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'footy';
  const password = 'test2222';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.log('Admin user already exists');
    return;
  }

  // Hash password
  const hashedPassword = await hash(password, 12);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  console.log('Admin user created successfully:', user.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

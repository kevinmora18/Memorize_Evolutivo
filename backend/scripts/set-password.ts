/**
 * set-password.ts - Asigna una contraseña a una cuenta existente.
 *
 * Uso:
 *   npx ts-node scripts/set-password.ts <email> <password>
 *
 * ¿Por qué existe? Antes el login no usaba contraseñas (cualquiera podía
 * entrar con cualquier email). Al migrar a autenticación real, las cuentas
 * antiguas no tienen passwordHash y no pueden iniciar sesión. Este script
 * permite a un operador asignarles una contraseña de forma controlada.
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error('Uso: npx ts-node scripts/set-password.ts <email> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No existe un usuario con email: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`Contraseña actualizada para ${email} (id: ${user.id}, rol: ${user.role})`);
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

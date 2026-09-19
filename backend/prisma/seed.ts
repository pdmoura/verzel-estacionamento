/**
 * Seed de demonstração: cria setores de exemplo quando o banco está vazio.
 * Idempotente: não duplica setores existentes.
 *
 *   npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SECTORS = [
  { name: 'Setor A', location: 'Ala Norte, próximo à fonte', reservableQuota: 12, hourlyRate: 5.5 },
  { name: 'Setor B', location: 'Ala Sul, em frente ao coreto', reservableQuota: 8, hourlyRate: 6.0 },
  { name: 'Setor C', location: 'Ala Leste, acesso pela Rua das Flores', reservableQuota: 6, hourlyRate: 4.5 },
  { name: 'Setor VIP', location: 'Entrada principal, coberto', reservableQuota: 3, hourlyRate: 12.0 },
];

async function main() {
  const existing = await prisma.sector.count();
  if (existing > 0) {
    console.log(`Seed ignorado: ${existing} setor(es) já cadastrado(s).`);
    return;
  }

  for (const s of SECTORS) {
    await prisma.sector.create({
      data: { ...s, availableSpots: s.reservableQuota },
    });
  }
  console.log(`Seed concluído: ${SECTORS.length} setores criados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

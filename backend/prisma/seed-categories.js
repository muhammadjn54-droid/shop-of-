const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { key: 'stationery', nameTg: 'Конставар', nameRu: 'Канцтовары', nameEn: 'Stationery', icon: '✏️' },
    { key: 'toys', nameTg: 'Игрушка', nameRu: 'Игрушки', nameEn: 'Toys', icon: '🧸' },
    { key: 'perfumery', nameTg: 'Порфимерия', nameRu: 'Парфюмерия', nameEn: 'Perfumery', icon: '🧴' },
    { key: 'accessories', nameTg: 'Зарядмонакҳо', nameRu: 'Зарядники и аксессуары', nameEn: 'Accessories & Chargers', icon: '🔌' },
  ];

  for (const c of categories) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO categories (key, name_tg, name_ru, name_en, icon, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (key) DO UPDATE
       SET name_tg = $2, name_ru = $3, name_en = $4, icon = $5`,
      c.key,
      c.nameTg,
      c.nameRu,
      c.nameEn,
      c.icon
    );
  }

  const all = await prisma.$queryRawUnsafe('SELECT * FROM categories ORDER BY id ASC');
  console.log('Seeded categories in PostgreSQL:', all);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

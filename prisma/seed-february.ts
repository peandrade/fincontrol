import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = "cmkqcday50002qewcd7yriqx2";

function getDateInMonth(day: number): Date {
  return new Date(2026, 1, day, 12, 0, 0, 0); // Fevereiro 2026
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌱 Criando seed para Fevereiro 2026...");

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    console.error("❌ Usuário não encontrado:", USER_ID);
    return;
  }

  console.log("✅ Usuário encontrado:", user.name || user.email);

  // Limpar apenas transações de fevereiro 2026
  const startOfFeb = new Date(2026, 1, 1, 0, 0, 0, 0);
  const endOfFeb = new Date(2026, 1, 28, 23, 59, 59, 999);

  console.log("🧹 Removendo transações existentes de Fevereiro 2026...");
  await prisma.transaction.deleteMany({
    where: {
      userId: USER_ID,
      date: {
        gte: startOfFeb,
        lte: endOfFeb,
      },
    },
  });

  const transactions: Array<{
    type: "income" | "expense";
    value: number;
    category: string;
    description: string;
    date: Date;
    userId: string;
  }> = [];

  // ==================== RECEITAS ====================

  // Salário
  transactions.push({
    type: "income",
    value: 8450.00,
    category: "Salário",
    description: "Salário mensal",
    date: getDateInMonth(5),
    userId: USER_ID,
  });

  // Freelances
  transactions.push({
    type: "income",
    value: 2800.00,
    category: "Freelance",
    description: "Projeto landing page",
    date: getDateInMonth(12),
    userId: USER_ID,
  });

  transactions.push({
    type: "income",
    value: 1500.00,
    category: "Freelance",
    description: "Consultoria técnica",
    date: getDateInMonth(20),
    userId: USER_ID,
  });

  // Dividendos
  transactions.push({
    type: "income",
    value: 385.50,
    category: "Dividendos",
    description: "Dividendos FIIs",
    date: getDateInMonth(15),
    userId: USER_ID,
  });

  // Reembolso
  transactions.push({
    type: "income",
    value: 156.00,
    category: "Reembolso",
    description: "Cashback cartão",
    date: getDateInMonth(18),
    userId: USER_ID,
  });

  // ==================== DESPESAS FIXAS ====================

  // Moradia
  transactions.push({
    type: "expense",
    value: 2200.00,
    category: "Moradia",
    description: "Aluguel do apartamento",
    date: getDateInMonth(10),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 465.00,
    category: "Moradia",
    description: "Taxa de condomínio",
    date: getDateInMonth(15),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 285.50,
    category: "Moradia",
    description: "Conta de luz",
    date: getDateInMonth(18),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 98.00,
    category: "Moradia",
    description: "Conta de água",
    date: getDateInMonth(22),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 72.00,
    category: "Moradia",
    description: "Gás encanado",
    date: getDateInMonth(25),
    userId: USER_ID,
  });

  // Serviços
  transactions.push({
    type: "expense",
    value: 129.90,
    category: "Serviços",
    description: "Internet fibra 500mb",
    date: getDateInMonth(20),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 79.90,
    category: "Serviços",
    description: "Plano de celular",
    date: getDateInMonth(12),
    userId: USER_ID,
  });

  // Assinaturas
  const subscriptions = [
    { desc: "Netflix", value: 55.90, day: 8 },
    { desc: "Spotify Premium", value: 21.90, day: 8 },
    { desc: "Amazon Prime", value: 14.90, day: 8 },
    { desc: "iCloud 200GB", value: 14.90, day: 15 },
    { desc: "ChatGPT Plus", value: 104.00, day: 10 },
    { desc: "GitHub Copilot", value: 50.00, day: 10 },
    { desc: "Disney+", value: 33.90, day: 5 },
  ];

  for (const sub of subscriptions) {
    transactions.push({
      type: "expense",
      value: sub.value,
      category: "Assinaturas",
      description: sub.desc,
      date: getDateInMonth(sub.day),
      userId: USER_ID,
    });
  }

  // Saúde
  transactions.push({
    type: "expense",
    value: 149.90,
    category: "Saúde",
    description: "Academia Smart Fit",
    date: getDateInMonth(5),
    userId: USER_ID,
  });

  // ==================== ALIMENTAÇÃO ====================

  // Supermercados
  const supermarkets = [
    { desc: "Supermercado Extra", value: 385.50, day: 3 },
    { desc: "Carrefour", value: 267.80, day: 8 },
    { desc: "Pão de Açúcar", value: 198.40, day: 14 },
    { desc: "Assaí", value: 445.00, day: 18 },
    { desc: "Supermercado Extra", value: 156.90, day: 22 },
    { desc: "Hirota", value: 89.50, day: 26 },
  ];

  for (const market of supermarkets) {
    transactions.push({
      type: "expense",
      value: market.value,
      category: "Alimentação",
      description: market.desc,
      date: getDateInMonth(market.day),
      userId: USER_ID,
    });
  }

  // Delivery
  const deliveries = [
    { desc: "iFood", value: 68.90, day: 1 },
    { desc: "Rappi", value: 45.50, day: 4 },
    { desc: "iFood", value: 52.00, day: 7 },
    { desc: "Uber Eats", value: 78.90, day: 9 },
    { desc: "iFood", value: 35.50, day: 11 },
    { desc: "Zé Delivery", value: 89.00, day: 13 },
    { desc: "iFood", value: 62.00, day: 16 },
    { desc: "Rappi", value: 55.00, day: 19 },
    { desc: "iFood", value: 42.90, day: 21 },
    { desc: "iFood", value: 58.50, day: 24 },
    { desc: "Uber Eats", value: 95.00, day: 27 },
  ];

  for (const delivery of deliveries) {
    transactions.push({
      type: "expense",
      value: delivery.value,
      category: "Alimentação",
      description: delivery.desc,
      date: getDateInMonth(delivery.day),
      userId: USER_ID,
    });
  }

  // Restaurantes e cafés
  const restaurants = [
    { desc: "Almoço executivo", value: 45.00, day: 2 },
    { desc: "Starbucks", value: 28.50, day: 3 },
    { desc: "Padaria", value: 18.90, day: 5 },
    { desc: "Jantar Outback", value: 185.00, day: 8 },
    { desc: "Café", value: 12.00, day: 10 },
    { desc: "Lanchonete", value: 25.00, day: 12 },
    { desc: "Brunch", value: 95.00, day: 15 },
    { desc: "Starbucks", value: 32.00, day: 17 },
    { desc: "Happy Hour", value: 120.00, day: 20 },
    { desc: "Padaria", value: 22.50, day: 23 },
    { desc: "Café", value: 15.00, day: 25 },
    { desc: "Almoço", value: 48.00, day: 28 },
  ];

  for (const rest of restaurants) {
    transactions.push({
      type: "expense",
      value: rest.value,
      category: "Alimentação",
      description: rest.desc,
      date: getDateInMonth(rest.day),
      userId: USER_ID,
    });
  }

  // ==================== TRANSPORTE ====================

  // Uber/99
  const rides = [
    { desc: "Uber", value: 25.50, day: 2 },
    { desc: "99", value: 18.00, day: 4 },
    { desc: "Uber", value: 32.00, day: 6 },
    { desc: "Uber", value: 28.90, day: 9 },
    { desc: "99", value: 22.00, day: 11 },
    { desc: "Uber", value: 45.00, day: 14 },
    { desc: "Uber", value: 19.50, day: 16 },
    { desc: "99", value: 35.00, day: 19 },
    { desc: "Uber", value: 28.00, day: 22 },
    { desc: "Uber", value: 42.00, day: 25 },
    { desc: "99", value: 24.50, day: 27 },
  ];

  for (const ride of rides) {
    transactions.push({
      type: "expense",
      value: ride.value,
      category: "Transporte",
      description: ride.desc,
      date: getDateInMonth(ride.day),
      userId: USER_ID,
    });
  }

  // Combustível
  transactions.push({
    type: "expense",
    value: 245.00,
    category: "Transporte",
    description: "Posto Shell",
    date: getDateInMonth(7),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 210.00,
    category: "Transporte",
    description: "Posto Ipiranga",
    date: getDateInMonth(18),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 198.00,
    category: "Transporte",
    description: "Posto BR",
    date: getDateInMonth(26),
    userId: USER_ID,
  });

  // Estacionamento
  transactions.push({
    type: "expense",
    value: 25.00,
    category: "Transporte",
    description: "Estacionamento Shopping",
    date: getDateInMonth(8),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 18.00,
    category: "Transporte",
    description: "Estacionamento",
    date: getDateInMonth(15),
    userId: USER_ID,
  });

  // ==================== SAÚDE ====================

  transactions.push({
    type: "expense",
    value: 125.00,
    category: "Saúde",
    description: "Drogasil",
    date: getDateInMonth(5),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 85.00,
    category: "Saúde",
    description: "Droga Raia",
    date: getDateInMonth(19),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 280.00,
    category: "Saúde",
    description: "Consulta médica",
    date: getDateInMonth(12),
    userId: USER_ID,
  });

  // ==================== LAZER ====================

  transactions.push({
    type: "expense",
    value: 85.00,
    category: "Lazer",
    description: "Cinema Cinemark",
    date: getDateInMonth(8),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 150.00,
    category: "Lazer",
    description: "Bar com amigos",
    date: getDateInMonth(14),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 189.90,
    category: "Lazer",
    description: "Steam - jogo novo",
    date: getDateInMonth(16),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 120.00,
    category: "Lazer",
    description: "Escape room",
    date: getDateInMonth(22),
    userId: USER_ID,
  });

  // ==================== COMPRAS ====================

  transactions.push({
    type: "expense",
    value: 259.00,
    category: "Compras",
    description: "Amazon",
    date: getDateInMonth(3),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 189.90,
    category: "Compras",
    description: "Mercado Livre",
    date: getDateInMonth(10),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 450.00,
    category: "Compras",
    description: "Kabum",
    date: getDateInMonth(17),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 89.90,
    category: "Compras",
    description: "Shopee",
    date: getDateInMonth(24),
    userId: USER_ID,
  });

  // ==================== PETS ====================

  transactions.push({
    type: "expense",
    value: 185.00,
    category: "Pets",
    description: "Ração premium",
    date: getDateInMonth(6),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 95.00,
    category: "Pets",
    description: "Banho e tosa",
    date: getDateInMonth(20),
    userId: USER_ID,
  });

  // ==================== VESTUÁRIO ====================

  transactions.push({
    type: "expense",
    value: 289.90,
    category: "Vestuário",
    description: "Nike",
    date: getDateInMonth(11),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 159.00,
    category: "Vestuário",
    description: "Renner",
    date: getDateInMonth(23),
    userId: USER_ID,
  });

  // ==================== BELEZA ====================

  transactions.push({
    type: "expense",
    value: 75.00,
    category: "Beleza",
    description: "Barbearia",
    date: getDateInMonth(13),
    userId: USER_ID,
  });

  // ==================== EDUCAÇÃO ====================

  transactions.push({
    type: "expense",
    value: 49.90,
    category: "Educação",
    description: "Udemy - curso React",
    date: getDateInMonth(9),
    userId: USER_ID,
  });

  transactions.push({
    type: "expense",
    value: 89.00,
    category: "Educação",
    description: "Livros Amazon",
    date: getDateInMonth(21),
    userId: USER_ID,
  });

  // ==================== PRESENTES ====================

  transactions.push({
    type: "expense",
    value: 180.00,
    category: "Presentes",
    description: "Presente Dia dos Namorados (antecipado)",
    date: getDateInMonth(14),
    userId: USER_ID,
  });

  // ==================== INSERIR TRANSAÇÕES ====================

  console.log(`💰 Inserindo ${transactions.length} transações para Fevereiro 2026...`);
  await prisma.transaction.createMany({ data: transactions });

  // Calcular totais
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  console.log("");
  console.log("✅ Seed de Fevereiro 2026 concluído!");
  console.log("");
  console.log("📊 Resumo:");
  console.log(`   • Total de transações: ${transactions.length}`);
  console.log(`   • Receitas: ${transactions.filter(t => t.type === "income").length} (R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);
  console.log(`   • Despesas: ${transactions.filter(t => t.type === "expense").length} (R$ ${totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);
  console.log(`   • Saldo: R$ ${(totalIncome - totalExpense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

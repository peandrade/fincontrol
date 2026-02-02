import { PrismaClient, GoalCategory } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = "cmkqcday50002qewcd7yriqx2";

function getDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getDateInMonth(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
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
  console.log("🌱 Iniciando seed para o usuário:", USER_ID);

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    console.error("❌ Usuário não encontrado:", USER_ID);
    return;
  }

  console.log("✅ Usuário encontrado:", user.name || user.email);

  console.log("🧹 Limpando dados existentes...");
  await prisma.goalContribution.deleteMany({ where: { goal: { userId: USER_ID } } });
  await prisma.financialGoal.deleteMany({ where: { userId: USER_ID } });
  await prisma.purchase.deleteMany({ where: { invoice: { creditCard: { userId: USER_ID } } } });
  await prisma.invoice.deleteMany({ where: { creditCard: { userId: USER_ID } } });
  await prisma.creditCard.deleteMany({ where: { userId: USER_ID } });
  await prisma.operation.deleteMany({ where: { investment: { userId: USER_ID } } });
  await prisma.investment.deleteMany({ where: { userId: USER_ID } });
  await prisma.recurringExpense.deleteMany({ where: { userId: USER_ID } });
  await prisma.budget.deleteMany({ where: { userId: USER_ID } });
  await prisma.transactionTemplate.deleteMany({ where: { userId: USER_ID } });
  await prisma.transaction.deleteMany({ where: { userId: USER_ID } });
  await prisma.category.deleteMany({ where: { userId: USER_ID } });

  console.log("📁 Criando categorias...");

  const expenseCategories = [
    { name: "Alimentação", icon: "Utensils", color: "#F97316" },
    { name: "Transporte", icon: "Car", color: "#3B82F6" },
    { name: "Moradia", icon: "Home", color: "#8B5CF6" },
    { name: "Saúde", icon: "Heart", color: "#EF4444" },
    { name: "Educação", icon: "GraduationCap", color: "#10B981" },
    { name: "Lazer", icon: "Gamepad2", color: "#EC4899" },
    { name: "Compras", icon: "ShoppingBag", color: "#F59E0B" },
    { name: "Serviços", icon: "Wrench", color: "#6366F1" },
    { name: "Assinaturas", icon: "CreditCard", color: "#14B8A6" },
    { name: "Pets", icon: "PawPrint", color: "#A855F7" },
    { name: "Impostos", icon: "Receipt", color: "#64748B" },
    { name: "Vestuário", icon: "Shirt", color: "#0EA5E9" },
    { name: "Beleza", icon: "Sparkles", color: "#F472B6" },
    { name: "Presentes", icon: "Gift", color: "#FB7185" },
    { name: "Viagem", icon: "Plane", color: "#22D3EE" },
    { name: "Outros", icon: "MoreHorizontal", color: "#78716C" },
  ];

  const incomeCategories = [
    { name: "Salário", icon: "Wallet", color: "#10B981" },
    { name: "Freelance", icon: "Laptop", color: "#3B82F6" },
    { name: "Investimentos", icon: "TrendingUp", color: "#8B5CF6" },
    { name: "Dividendos", icon: "Coins", color: "#F59E0B" },
    { name: "Vendas", icon: "Store", color: "#EC4899" },
    { name: "Presente", icon: "Gift", color: "#EF4444" },
    { name: "Reembolso", icon: "RotateCcw", color: "#14B8A6" },
    { name: "Aluguel", icon: "Home", color: "#6366F1" },
    { name: "Bônus", icon: "Award", color: "#F97316" },
    { name: "Outros", icon: "MoreHorizontal", color: "#78716C" },
  ];

  await prisma.category.createMany({
    data: expenseCategories.map(cat => ({ ...cat, type: "expense", userId: USER_ID })),
  });

  await prisma.category.createMany({
    data: incomeCategories.map(cat => ({ ...cat, type: "income", userId: USER_ID })),
  });

  console.log("💰 Criando transações (18 meses de histórico)...");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const allTransactions: Array<{
    type: "income" | "expense";
    value: number;
    category: string;
    description: string;
    date: Date;
    userId: string;
  }> = [];

  // 18 meses de histórico
  for (let monthOffset = 0; monthOffset < 18; monthOffset++) {
    let month = currentMonth - monthOffset;
    let year = currentYear;
    while (month < 0) {
      month += 12;
      year -= 1;
    }

    // Salário (com aumento gradual ao longo do tempo)
    const baseSalary = 7500 + (18 - monthOffset) * 50;
    allTransactions.push({
      type: "income",
      value: baseSalary + randomBetween(-200, 200),
      category: "Salário",
      description: "Salário mensal",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // Freelance (alguns meses)
    if (Math.random() > 0.4) {
      const freelanceCount = randomInt(1, 4);
      for (let i = 0; i < freelanceCount; i++) {
        allTransactions.push({
          type: "income",
          value: randomBetween(800, 3500),
          category: "Freelance",
          description: pickRandom(["Projeto web", "Consultoria", "Design", "Desenvolvimento app", "Landing page"]),
          date: getDateInMonth(year, month, randomInt(10, 28)),
          userId: USER_ID,
        });
      }
    }

    // Dividendos (mensal)
    if (monthOffset < 12) {
      allTransactions.push({
        type: "income",
        value: randomBetween(150, 450),
        category: "Dividendos",
        description: "Dividendos FIIs",
        date: getDateInMonth(year, month, 15),
        userId: USER_ID,
      });
    }

    // Bônus (trimestral)
    if (month % 3 === 0 && Math.random() > 0.3) {
      allTransactions.push({
        type: "income",
        value: randomBetween(1500, 4000),
        category: "Bônus",
        description: "Bônus trimestral",
        date: getDateInMonth(year, month, randomInt(20, 28)),
        userId: USER_ID,
      });
    }

    // Reembolsos esporádicos
    if (Math.random() > 0.7) {
      allTransactions.push({
        type: "income",
        value: randomBetween(50, 500),
        category: "Reembolso",
        description: pickRandom(["Reembolso empresa", "Devolução compra", "Cashback"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === DESPESAS FIXAS ===

    // Aluguel
    allTransactions.push({
      type: "expense",
      value: 2200,
      category: "Moradia",
      description: "Aluguel do apartamento",
      date: getDateInMonth(year, month, 10),
      userId: USER_ID,
    });

    // Condomínio
    allTransactions.push({
      type: "expense",
      value: randomBetween(420, 480),
      category: "Moradia",
      description: "Taxa de condomínio",
      date: getDateInMonth(year, month, 15),
      userId: USER_ID,
    });

    // Internet
    allTransactions.push({
      type: "expense",
      value: 129.90,
      category: "Serviços",
      description: "Internet fibra 500mb",
      date: getDateInMonth(year, month, 20),
      userId: USER_ID,
    });

    // Celular
    allTransactions.push({
      type: "expense",
      value: 79.90,
      category: "Serviços",
      description: "Plano de celular",
      date: getDateInMonth(year, month, 12),
      userId: USER_ID,
    });

    // Luz (variável por estação)
    const isWinter = month >= 5 && month <= 8;
    allTransactions.push({
      type: "expense",
      value: randomBetween(isWinter ? 150 : 200, isWinter ? 220 : 320),
      category: "Moradia",
      description: "Conta de luz",
      date: getDateInMonth(year, month, 18),
      userId: USER_ID,
    });

    // Água
    allTransactions.push({
      type: "expense",
      value: randomBetween(75, 120),
      category: "Moradia",
      description: "Conta de água",
      date: getDateInMonth(year, month, 22),
      userId: USER_ID,
    });

    // Gás
    if (Math.random() > 0.3) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(45, 90),
        category: "Moradia",
        description: "Gás encanado",
        date: getDateInMonth(year, month, 25),
        userId: USER_ID,
      });
    }

    // === ASSINATURAS ===
    const subscriptions = [
      { desc: "Netflix", value: 55.90 },
      { desc: "Spotify Premium", value: 21.90 },
      { desc: "Amazon Prime", value: 14.90 },
      { desc: "iCloud 200GB", value: 14.90 },
      { desc: "ChatGPT Plus", value: 104.00 },
      { desc: "GitHub Copilot", value: 50.00 },
    ];

    for (const sub of subscriptions) {
      allTransactions.push({
        type: "expense",
        value: sub.value,
        category: "Assinaturas",
        description: sub.desc,
        date: getDateInMonth(year, month, randomInt(5, 12)),
        userId: USER_ID,
      });
    }

    // Academia
    allTransactions.push({
      type: "expense",
      value: 149.90,
      category: "Saúde",
      description: "Academia Smart Fit",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // === ALIMENTAÇÃO ===

    // Supermercado (várias idas)
    const supermarketCount = randomInt(5, 9);
    const supermarkets = ["Supermercado Extra", "Carrefour", "Pão de Açúcar", "Assaí", "Big", "Hirota"];
    for (let i = 0; i < supermarketCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(80, 450),
        category: "Alimentação",
        description: pickRandom(supermarkets),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Delivery
    const deliveryCount = randomInt(8, 16);
    const deliveryApps = ["iFood", "Rappi", "Uber Eats", "Zé Delivery"];
    for (let i = 0; i < deliveryCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(25, 95),
        category: "Alimentação",
        description: pickRandom(deliveryApps),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Restaurantes
    const restaurantCount = randomInt(3, 7);
    const restaurants = ["Almoço", "Jantar", "Happy Hour", "Brunch", "Lanchonete", "Padaria"];
    for (let i = 0; i < restaurantCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(40, 180),
        category: "Alimentação",
        description: pickRandom(restaurants),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Café
    const coffeeCount = randomInt(4, 12);
    for (let i = 0; i < coffeeCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(8, 35),
        category: "Alimentação",
        description: pickRandom(["Starbucks", "Café", "Padaria", "Lanchonete"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === TRANSPORTE ===

    // Uber/99
    const uberCount = randomInt(6, 18);
    for (let i = 0; i < uberCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(12, 55),
        category: "Transporte",
        description: pickRandom(["Uber", "99", "Uber"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Combustível
    const gasCount = randomInt(2, 5);
    for (let i = 0; i < gasCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(150, 280),
        category: "Transporte",
        description: pickRandom(["Posto Shell", "Posto Ipiranga", "Posto BR", "Posto Ale"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Estacionamento
    if (Math.random() > 0.4) {
      const parkingCount = randomInt(2, 6);
      for (let i = 0; i < parkingCount; i++) {
        allTransactions.push({
          type: "expense",
          value: randomBetween(10, 35),
          category: "Transporte",
          description: "Estacionamento",
          date: getDateInMonth(year, month, randomInt(1, 28)),
          userId: USER_ID,
        });
      }
    }

    // === SAÚDE ===

    // Farmácia
    const pharmacyCount = randomInt(1, 4);
    for (let i = 0; i < pharmacyCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(30, 180),
        category: "Saúde",
        description: pickRandom(["Drogasil", "Droga Raia", "Pacheco", "Drogaria São Paulo"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Consultas médicas (esporádico)
    if (Math.random() > 0.7) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(150, 400),
        category: "Saúde",
        description: pickRandom(["Consulta médica", "Dentista", "Exames", "Oftalmologista"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === LAZER ===
    const leisureCount = randomInt(2, 6);
    const leisureOptions = ["Cinema", "Teatro", "Bar", "Show", "Parque", "Museu", "Escape room", "Boliche", "Karaokê"];
    for (let i = 0; i < leisureCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(30, 200),
        category: "Lazer",
        description: pickRandom(leisureOptions),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // Games
    if (Math.random() > 0.5) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(50, 300),
        category: "Lazer",
        description: pickRandom(["Steam", "PlayStation Store", "Nintendo eShop", "Xbox Game Pass"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === COMPRAS ===
    const shoppingCount = randomInt(2, 6);
    const stores = ["Amazon", "Mercado Livre", "Magazine Luiza", "Shopee", "AliExpress", "Americanas", "Kabum"];
    for (let i = 0; i < shoppingCount; i++) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(50, 500),
        category: "Compras",
        description: pickRandom(stores),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === PETS ===
    if (Math.random() > 0.3) {
      const petCount = randomInt(1, 3);
      for (let i = 0; i < petCount; i++) {
        allTransactions.push({
          type: "expense",
          value: randomBetween(80, 350),
          category: "Pets",
          description: pickRandom(["Ração", "Veterinário", "Pet shop", "Banho e tosa", "Petlove"]),
          date: getDateInMonth(year, month, randomInt(1, 28)),
          userId: USER_ID,
        });
      }
    }

    // === VESTUÁRIO ===
    if (Math.random() > 0.4) {
      const clothingCount = randomInt(1, 3);
      const clothingStores = ["Renner", "C&A", "Riachuelo", "Zara", "Nike", "Adidas", "Centauro", "Netshoes"];
      for (let i = 0; i < clothingCount; i++) {
        allTransactions.push({
          type: "expense",
          value: randomBetween(80, 400),
          category: "Vestuário",
          description: pickRandom(clothingStores),
          date: getDateInMonth(year, month, randomInt(1, 28)),
          userId: USER_ID,
        });
      }
    }

    // === BELEZA ===
    if (Math.random() > 0.5) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(50, 200),
        category: "Beleza",
        description: pickRandom(["Barbearia", "Cabeleireiro", "Manicure", "Skincare"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === EDUCAÇÃO ===
    if (Math.random() > 0.6) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(30, 200),
        category: "Educação",
        description: pickRandom(["Udemy", "Alura", "Livros", "Curso online", "Inglês"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }

    // === PRESENTES (em datas especiais) ===
    if (Math.random() > 0.7) {
      allTransactions.push({
        type: "expense",
        value: randomBetween(50, 300),
        category: "Presentes",
        description: pickRandom(["Presente aniversário", "Presente namoro", "Amigo secreto"]),
        date: getDateInMonth(year, month, randomInt(1, 28)),
        userId: USER_ID,
      });
    }
  }

  // Batch insert transactions
  console.log(`   Inserindo ${allTransactions.length} transações...`);
  await prisma.transaction.createMany({ data: allTransactions });

  console.log("📋 Criando templates...");

  const templates = [
    { name: "Almoço", description: "Almoço na empresa", category: "Alimentação", type: "expense" as const, value: 35 },
    { name: "Uber Casa", description: "Uber para casa", category: "Transporte", type: "expense" as const, value: 25 },
    { name: "Uber Trabalho", description: "Uber para o trabalho", category: "Transporte", type: "expense" as const, value: 28 },
    { name: "Supermercado", description: "Compras do mês", category: "Alimentação", type: "expense" as const, value: null },
    { name: "iFood", description: null, category: "Alimentação", type: "expense" as const, value: null },
    { name: "Freelance", description: "Projeto freelance", category: "Freelance", type: "income" as const, value: null },
    { name: "Pix Recebido", description: null, category: "Outros", type: "income" as const, value: null },
    { name: "Café", description: "Café da manhã", category: "Alimentação", type: "expense" as const, value: 15 },
    { name: "Farmácia", description: null, category: "Saúde", type: "expense" as const, value: null },
    { name: "Combustível", description: "Gasolina", category: "Transporte", type: "expense" as const, value: 200 },
  ];

  await prisma.transactionTemplate.createMany({
    data: templates.map(t => ({ ...t, usageCount: Math.floor(Math.random() * 30), userId: USER_ID })),
  });

  console.log("📊 Criando orçamentos...");

  const budgets = [
    { category: "Alimentação", limit: 2500 },
    { category: "Transporte", limit: 1000 },
    { category: "Lazer", limit: 600 },
    { category: "Compras", limit: 800 },
    { category: "Assinaturas", limit: 350 },
    { category: "Saúde", limit: 500 },
    { category: "Vestuário", limit: 400 },
    { category: "Pets", limit: 300 },
  ];

  await prisma.budget.createMany({
    data: budgets.map(b => ({ ...b, month: 0, year: 0, userId: USER_ID })),
  });

  console.log("🔄 Criando despesas recorrentes...");

  const recurringExpenses = [
    { description: "Aluguel", value: 2200, category: "Moradia", dueDay: 10 },
    { description: "Condomínio", value: 450, category: "Moradia", dueDay: 15 },
    { description: "Internet", value: 129.90, category: "Serviços", dueDay: 20 },
    { description: "Celular", value: 79.90, category: "Serviços", dueDay: 12 },
    { description: "Netflix", value: 55.90, category: "Assinaturas", dueDay: 8 },
    { description: "Spotify", value: 21.90, category: "Assinaturas", dueDay: 8 },
    { description: "Amazon Prime", value: 14.90, category: "Assinaturas", dueDay: 8 },
    { description: "Academia Smart Fit", value: 149.90, category: "Saúde", dueDay: 5 },
    { description: "iCloud 200GB", value: 14.90, category: "Assinaturas", dueDay: 15 },
    { description: "ChatGPT Plus", value: 104.00, category: "Assinaturas", dueDay: 10 },
    { description: "GitHub Copilot", value: 50.00, category: "Assinaturas", dueDay: 10 },
  ];

  await prisma.recurringExpense.createMany({
    data: recurringExpenses.map(e => ({ ...e, isActive: true, userId: USER_ID })),
  });

  console.log("📈 Criando investimentos com histórico de operações...");

  // AÇÕES
  const stocks = [
    { name: "Petrobras", ticker: "PETR4", operations: [
      { date: 365, type: "buy", qty: 100, price: 28.50 },
      { date: 280, type: "buy", qty: 50, price: 32.00 },
      { date: 180, type: "buy", qty: 100, price: 35.00 },
      { date: 90, type: "sell", qty: 50, price: 42.00 },
    ], currentPrice: 38.20 },
    { name: "Vale", ticker: "VALE3", operations: [
      { date: 400, type: "buy", qty: 80, price: 75.00 },
      { date: 300, type: "buy", qty: 50, price: 68.00 },
      { date: 150, type: "sell", qty: 30, price: 72.00 },
    ], currentPrice: 62.50 },
    { name: "Itaú Unibanco", ticker: "ITUB4", operations: [
      { date: 500, type: "buy", qty: 100, price: 24.00 },
      { date: 350, type: "buy", qty: 100, price: 27.00 },
      { date: 200, type: "buy", qty: 50, price: 30.00 },
    ], currentPrice: 32.80 },
    { name: "Banco do Brasil", ticker: "BBAS3", operations: [
      { date: 450, type: "buy", qty: 60, price: 38.00 },
      { date: 300, type: "buy", qty: 40, price: 45.00 },
      { date: 100, type: "buy", qty: 30, price: 50.00 },
    ], currentPrice: 52.30 },
    { name: "WEG", ticker: "WEGE3", operations: [
      { date: 380, type: "buy", qty: 40, price: 35.00 },
      { date: 200, type: "buy", qty: 30, price: 40.00 },
    ], currentPrice: 44.50 },
    { name: "Ambev", ticker: "ABEV3", operations: [
      { date: 320, type: "buy", qty: 150, price: 12.50 },
      { date: 180, type: "buy", qty: 100, price: 13.00 },
    ], currentPrice: 11.80 },
    { name: "Magazine Luiza", ticker: "MGLU3", operations: [
      { date: 400, type: "buy", qty: 200, price: 8.00 },
      { date: 250, type: "sell", qty: 100, price: 5.50 },
    ], currentPrice: 12.30 },
    { name: "B3", ticker: "B3SA3", operations: [
      { date: 280, type: "buy", qty: 80, price: 11.00 },
      { date: 150, type: "buy", qty: 50, price: 12.50 },
    ], currentPrice: 13.20 },
  ];

  const allOperations: Array<{
    investmentId: string;
    type: "buy" | "sell" | "deposit" | "withdraw";
    quantity: number;
    price: number;
    total: number;
    date: Date;
    fees: number;
  }> = [];

  for (const stock of stocks) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of stock.operations) {
      if (op.type === "buy") {
        totalCost += op.qty * op.price;
        totalQty += op.qty;
      } else {
        totalCost -= (totalCost / totalQty) * op.qty;
        totalQty -= op.qty;
      }
    }

    const averagePrice = totalQty > 0 ? totalCost / totalQty : 0;
    const currentValue = totalQty * stock.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    const investment = await prisma.investment.create({
      data: {
        type: "stock",
        name: stock.name,
        ticker: stock.ticker,
        institution: "XP Investimentos",
        quantity: totalQty,
        averagePrice,
        currentPrice: stock.currentPrice,
        totalInvested: totalCost,
        currentValue,
        profitLoss,
        profitLossPercent,
        userId: USER_ID,
      },
    });

    for (const op of stock.operations) {
      allOperations.push({
        investmentId: investment.id,
        type: op.type as "buy" | "sell",
        quantity: op.qty,
        price: op.price,
        total: op.qty * op.price,
        date: getDate(op.date),
        fees: op.qty * op.price * 0.0003,
      });
    }
  }

  // FIIs
  const fiis = [
    { name: "HGLG11", ticker: "HGLG11", operations: [
      { date: 400, type: "buy", qty: 15, price: 160.00 },
      { date: 280, type: "buy", qty: 20, price: 165.00 },
      { date: 150, type: "buy", qty: 10, price: 158.00 },
    ], currentPrice: 162.50 },
    { name: "XPLG11", ticker: "XPLG11", operations: [
      { date: 350, type: "buy", qty: 30, price: 95.00 },
      { date: 200, type: "buy", qty: 30, price: 100.00 },
      { date: 80, type: "buy", qty: 20, price: 98.00 },
    ], currentPrice: 102.30 },
    { name: "MXRF11", ticker: "MXRF11", operations: [
      { date: 300, type: "buy", qty: 100, price: 10.20 },
      { date: 180, type: "buy", qty: 80, price: 10.50 },
      { date: 60, type: "buy", qty: 50, price: 10.30 },
    ], currentPrice: 10.45 },
    { name: "KNRI11", ticker: "KNRI11", operations: [
      { date: 380, type: "buy", qty: 15, price: 135.00 },
      { date: 220, type: "buy", qty: 15, price: 140.00 },
    ], currentPrice: 142.00 },
    { name: "VISC11", ticker: "VISC11", operations: [
      { date: 320, type: "buy", qty: 25, price: 110.00 },
      { date: 150, type: "buy", qty: 25, price: 115.00 },
    ], currentPrice: 118.50 },
    { name: "BTLG11", ticker: "BTLG11", operations: [
      { date: 250, type: "buy", qty: 20, price: 98.00 },
      { date: 100, type: "buy", qty: 15, price: 102.00 },
    ], currentPrice: 105.00 },
  ];

  for (const fii of fiis) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of fii.operations) {
      totalCost += op.qty * op.price;
      totalQty += op.qty;
    }

    const averagePrice = totalCost / totalQty;
    const currentValue = totalQty * fii.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = (profitLoss / totalCost) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "fii",
        name: fii.name,
        ticker: fii.ticker,
        institution: "XP Investimentos",
        quantity: totalQty,
        averagePrice,
        currentPrice: fii.currentPrice,
        totalInvested: totalCost,
        currentValue,
        profitLoss,
        profitLossPercent,
        userId: USER_ID,
      },
    });

    for (const op of fii.operations) {
      allOperations.push({
        investmentId: investment.id,
        type: "buy",
        quantity: op.qty,
        price: op.price,
        total: op.qty * op.price,
        date: getDate(op.date),
        fees: op.qty * op.price * 0.0003,
      });
    }
  }

  // CDBs
  const cdbs = [
    { name: "CDB Banco Inter 110% CDI", institution: "Banco Inter", deposits: [
      { date: 400, value: 5000 },
      { date: 250, value: 5000 },
      { date: 100, value: 3000 },
    ], interestRate: 110, indexer: "CDI", maturityMonths: 24 },
    { name: "CDB Nubank 100% CDI", institution: "Nubank", deposits: [
      { date: 300, value: 3000 },
      { date: 150, value: 3000 },
    ], interestRate: 100, indexer: "CDI", maturityMonths: 12 },
    { name: "CDB BTG IPCA+6%", institution: "BTG Pactual", deposits: [
      { date: 450, value: 10000 },
      { date: 200, value: 8000 },
    ], interestRate: 6, indexer: "IPCA", maturityMonths: 36 },
    { name: "CDB C6 Bank 102% CDI", institution: "C6 Bank", deposits: [
      { date: 180, value: 4000 },
      { date: 60, value: 3000 },
    ], interestRate: 102, indexer: "CDI", maturityMonths: 24 },
  ];

  for (const cdb of cdbs) {
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + cdb.maturityMonths);

    let totalInvested = 0;
    for (const dep of cdb.deposits) {
      totalInvested += dep.value;
    }

    const avgDaysHeld = cdb.deposits.reduce((acc, d) => acc + d.date, 0) / cdb.deposits.length;
    const monthlyRate = cdb.indexer === "CDI" ? 0.0095 : 0.008;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + monthlyRate * (cdb.interestRate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "cdb",
        name: cdb.name,
        institution: cdb.institution,
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercent,
        interestRate: cdb.interestRate,
        indexer: cdb.indexer,
        maturityDate,
        userId: USER_ID,
      },
    });

    for (const dep of cdb.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: 1,
        price: dep.value,
        total: dep.value,
        date: getDate(dep.date),
        fees: 0,
      });
    }
  }

  // Tesouro Direto
  const treasuryData = [
    { name: "Tesouro Selic 2029", indexer: "SELIC", rate: 100, deposits: [
      { date: 500, value: 5000 },
      { date: 300, value: 5000 },
      { date: 150, value: 3000 },
    ], maturity: new Date(2029, 0, 1) },
    { name: "Tesouro IPCA+ 2035", indexer: "IPCA", rate: 6.5, deposits: [
      { date: 400, value: 8000 },
      { date: 200, value: 5000 },
    ], maturity: new Date(2035, 5, 15) },
  ];

  for (const treasury of treasuryData) {
    let totalInvested = 0;
    for (const dep of treasury.deposits) {
      totalInvested += dep.value;
    }

    const avgDaysHeld = treasury.deposits.reduce((acc, d) => acc + d.date, 0) / treasury.deposits.length;
    const monthlyRate = treasury.indexer === "SELIC" ? 0.0098 : 0.0085;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + monthlyRate * (treasury.rate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "treasury",
        name: treasury.name,
        institution: "Tesouro Direto",
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercent,
        interestRate: treasury.rate,
        indexer: treasury.indexer,
        maturityDate: treasury.maturity,
        userId: USER_ID,
      },
    });

    for (const dep of treasury.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: 1,
        price: dep.value,
        total: dep.value,
        date: getDate(dep.date),
        fees: 0,
      });
    }
  }

  // Cripto
  const cryptos = [
    { name: "Bitcoin", ticker: "BTC", operations: [
      { date: 450, type: "buy", qty: 0.02, price: 150000 },
      { date: 300, type: "buy", qty: 0.03, price: 180000 },
      { date: 150, type: "buy", qty: 0.02, price: 200000 },
      { date: 80, type: "sell", qty: 0.01, price: 210000 },
    ], currentPrice: 195000 },
    { name: "Ethereum", ticker: "ETH", operations: [
      { date: 380, type: "buy", qty: 0.3, price: 10000 },
      { date: 250, type: "buy", qty: 0.4, price: 12000 },
      { date: 100, type: "buy", qty: 0.2, price: 14000 },
    ], currentPrice: 13500 },
    { name: "Solana", ticker: "SOL", operations: [
      { date: 200, type: "buy", qty: 5, price: 120 },
      { date: 100, type: "buy", qty: 8, price: 150 },
    ], currentPrice: 180 },
  ];

  for (const crypto of cryptos) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of crypto.operations) {
      if (op.type === "buy") {
        totalCost += op.qty * op.price;
        totalQty += op.qty;
      } else {
        totalCost -= (totalCost / totalQty) * op.qty;
        totalQty -= op.qty;
      }
    }

    const averagePrice = totalQty > 0 ? totalCost / totalQty : 0;
    const currentValue = totalQty * crypto.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    const investment = await prisma.investment.create({
      data: {
        type: "crypto",
        name: crypto.name,
        ticker: crypto.ticker,
        institution: "Binance",
        quantity: totalQty,
        averagePrice,
        currentPrice: crypto.currentPrice,
        totalInvested: totalCost,
        currentValue,
        profitLoss,
        profitLossPercent,
        userId: USER_ID,
      },
    });

    for (const op of crypto.operations) {
      allOperations.push({
        investmentId: investment.id,
        type: op.type as "buy" | "sell",
        quantity: op.qty,
        price: op.price,
        total: op.qty * op.price,
        date: getDate(op.date),
        fees: op.qty * op.price * 0.001,
      });
    }
  }

  // Batch insert operations
  console.log(`   Inserindo ${allOperations.length} operações...`);
  await prisma.operation.createMany({ data: allOperations });

  console.log("💳 Criando cartões de crédito com histórico extenso...");

  const nubank = await prisma.creditCard.create({
    data: {
      name: "Nubank",
      lastDigits: "4532",
      limit: 18000,
      closingDay: 3,
      dueDay: 10,
      color: "#8B5CF6",
      isActive: true,
      userId: USER_ID,
    },
  });

  const inter = await prisma.creditCard.create({
    data: {
      name: "Banco Inter",
      lastDigits: "7891",
      limit: 10000,
      closingDay: 15,
      dueDay: 22,
      color: "#F97316",
      isActive: true,
      userId: USER_ID,
    },
  });

  const c6 = await prisma.creditCard.create({
    data: {
      name: "C6 Bank",
      lastDigits: "2468",
      limit: 15000,
      closingDay: 20,
      dueDay: 27,
      color: "#1F2937",
      isActive: true,
      userId: USER_ID,
    },
  });

  const xp = await prisma.creditCard.create({
    data: {
      name: "XP Visa Infinite",
      lastDigits: "9876",
      limit: 25000,
      closingDay: 8,
      dueDay: 15,
      color: "#10B981",
      isActive: true,
      userId: USER_ID,
    },
  });

  const cards = [
    { card: nubank, avgSpend: 4000 },
    { card: inter, avgSpend: 2000 },
    { card: c6, avgSpend: 2500 },
    { card: xp, avgSpend: 3500 },
  ];

  const purchaseCategories = [
    { category: "Alimentação", descriptions: ["iFood", "Rappi", "Restaurante Outback", "Supermercado Extra", "Burger King", "McDonald's", "Starbucks"], minValue: 20, maxValue: 350 },
    { category: "Compras", descriptions: ["Amazon", "Mercado Livre", "Magazine Luiza", "AliExpress", "Shopee", "Kabum", "Americanas", "Casas Bahia"], minValue: 50, maxValue: 800 },
    { category: "Transporte", descriptions: ["Uber", "99", "Posto Shell", "Posto Ipiranga", "Estacionamento"], minValue: 15, maxValue: 250 },
    { category: "Lazer", descriptions: ["Cinema Cinemark", "Ingresso.com", "Steam", "PlayStation Store", "Spotify", "Netflix"], minValue: 20, maxValue: 200 },
    { category: "Assinaturas", descriptions: ["Spotify Premium", "Netflix", "Disney+", "HBO Max", "Amazon Prime", "YouTube Premium"], minValue: 15, maxValue: 70 },
    { category: "Viagem", descriptions: ["Booking.com", "Airbnb", "Decolar", "LATAM Airlines", "GOL", "Hotel Ibis"], minValue: 200, maxValue: 2000 },
    { category: "Vestuário", descriptions: ["Renner", "C&A", "Zara", "Nike", "Adidas", "Centauro"], minValue: 80, maxValue: 500 },
    { category: "Saúde", descriptions: ["Drogasil", "Droga Raia", "Consulta médica", "Farmácia"], minValue: 30, maxValue: 300 },
  ];

  const allPurchases: Array<{
    invoiceId: string;
    description: string;
    value: number;
    totalValue: number;
    category: string;
    date: Date;
    installments: number;
    currentInstallment: number;
  }> = [];

  const invoiceUpdates: Array<{ id: string; total: number }> = [];

  for (const { card, avgSpend } of cards) {
    // 8 meses de faturas
    for (let monthOffset = 0; monthOffset < 8; monthOffset++) {
      let month = currentMonth - monthOffset;
      let year = currentYear;
      while (month < 0) {
        month += 12;
        year -= 1;
      }

      const closingDate = new Date(year, month, card.closingDay);
      const dueDate = new Date(year, month, card.dueDay);

      let status: "open" | "closed" | "paid" | "overdue" = "paid";
      if (monthOffset === 0) status = "open";
      else if (monthOffset === 1) status = "closed";

      const invoice = await prisma.invoice.create({
        data: {
          creditCardId: card.id,
          month: month + 1,
          year,
          closingDate,
          dueDate,
          status,
          total: 0,
          paidAmount: status === "paid" ? avgSpend * randomBetween(0.85, 1.15) : 0,
        },
      });

      let invoiceTotal = 0;
      const purchaseCount = randomInt(12, 22);

      for (let i = 0; i < purchaseCount; i++) {
        const catInfo = pickRandom(purchaseCategories);
        const description = pickRandom(catInfo.descriptions);
        const value = randomBetween(catInfo.minValue, catInfo.maxValue);

        const isInstallment = Math.random() > 0.75;
        const installments = isInstallment ? pickRandom([2, 3, 4, 6, 10, 12]) : 1;
        const installmentValue = value / installments;

        allPurchases.push({
          invoiceId: invoice.id,
          description,
          value: installmentValue,
          totalValue: value,
          category: catInfo.category,
          date: getDateInMonth(year, month, randomInt(1, 28)),
          installments,
          currentInstallment: 1,
        });

        invoiceTotal += installmentValue;
      }

      invoiceUpdates.push({ id: invoice.id, total: invoiceTotal });
    }
  }

  // Batch insert purchases
  console.log(`   Inserindo ${allPurchases.length} compras...`);
  await prisma.purchase.createMany({ data: allPurchases });

  // Update invoice totals
  for (const update of invoiceUpdates) {
    await prisma.invoice.update({
      where: { id: update.id },
      data: { total: update.total },
    });
  }

  console.log("🎯 Criando metas financeiras com contribuições...");

  const goals: Array<{
    name: string;
    description: string;
    category: GoalCategory;
    targetValue: number;
    currentValue: number;
    targetDate: Date;
    color: string;
    contributions: number;
  }> = [
    {
      name: "Reserva de Emergência",
      description: "6 meses de despesas - proteção financeira",
      category: GoalCategory.emergency,
      targetValue: 40000,
      currentValue: 28500,
      targetDate: new Date(currentYear + 1, 3, 30),
      color: "#10B981",
      contributions: 14,
    },
    {
      name: "Viagem Japão",
      description: "Férias de 20 dias no Japão",
      category: GoalCategory.travel,
      targetValue: 35000,
      currentValue: 12800,
      targetDate: new Date(currentYear + 2, 3, 15),
      color: "#3B82F6",
      contributions: 8,
    },
    {
      name: "Troca do Carro",
      description: "Entrada para um SUV novo",
      category: GoalCategory.car,
      targetValue: 60000,
      currentValue: 18500,
      targetDate: new Date(currentYear + 2, 6, 1),
      color: "#F97316",
      contributions: 10,
    },
    {
      name: "MBA FGV",
      description: "Pós-graduação em Gestão de Projetos",
      category: GoalCategory.education,
      targetValue: 45000,
      currentValue: 8200,
      targetDate: new Date(currentYear + 1, 7, 1),
      color: "#8B5CF6",
      contributions: 5,
    },
    {
      name: "Entrada Apartamento",
      description: "20% de entrada para financiamento",
      category: GoalCategory.house,
      targetValue: 180000,
      currentValue: 42000,
      targetDate: new Date(currentYear + 4, 0, 1),
      color: "#EC4899",
      contributions: 16,
    },
    {
      name: "Fundo para Aposentadoria",
      description: "Complemento de previdência",
      category: GoalCategory.retirement,
      targetValue: 500000,
      currentValue: 35000,
      targetDate: new Date(currentYear + 25, 0, 1),
      color: "#6366F1",
      contributions: 18,
    },
  ];

  const allContributions: Array<{
    goalId: string;
    value: number;
    date: Date;
    notes: string | null;
  }> = [];

  for (const goalData of goals) {
    const goal = await prisma.financialGoal.create({
      data: {
        name: goalData.name,
        description: goalData.description,
        category: goalData.category,
        targetValue: goalData.targetValue,
        currentValue: goalData.currentValue,
        targetDate: goalData.targetDate,
        color: goalData.color,
        userId: USER_ID,
      },
    });

    const avgContribution = goalData.currentValue / goalData.contributions;
    for (let i = 0; i < goalData.contributions; i++) {
      allContributions.push({
        goalId: goal.id,
        value: avgContribution * randomBetween(0.7, 1.3),
        date: getDate(i * 25 + randomInt(0, 15)),
        notes: i === 0 ? "Início da meta" : (Math.random() > 0.8 ? pickRandom(["Bônus extra", "Sobra do mês", "Freelance"]) : null),
      });
    }
  }

  // Batch insert contributions
  console.log(`   Inserindo ${allContributions.length} contribuições...`);
  await prisma.goalContribution.createMany({ data: allContributions });

  console.log("");
  console.log("✅ Seed concluído com sucesso!");
  console.log("");
  console.log("📊 Resumo dos dados criados:");
  console.log("   • Categorias: 26 (16 despesas + 10 receitas)");
  console.log(`   • Transações: ${allTransactions.length}`);
  console.log("   • Templates: 10");
  console.log("   • Orçamentos: 8");
  console.log("   • Despesas Recorrentes: 11");
  console.log("   • Investimentos: 23 (ações, FIIs, CDBs, Tesouro, Cripto)");
  console.log(`   • Operações de investimento: ${allOperations.length}`);
  console.log("   • Cartões de Crédito: 4 (com 8 meses de faturas cada)");
  console.log(`   • Compras no cartão: ${allPurchases.length}`);
  console.log("   • Metas Financeiras: 6");
  console.log(`   • Contribuições em metas: ${allContributions.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

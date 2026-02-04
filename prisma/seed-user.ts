import { PrismaClient, GoalCategory } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = "cml8dqk1x0000qeskfc4ykxg2";

function getDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getDateInMonth(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);
  return new Date(year, month, safeDay, 12, 0, 0, 0);
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌱 Iniciando seed para o usuário:", USER_ID);

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    console.error("❌ Usuário não encontrado:", USER_ID);
    process.exit(1);
  }

  console.log("✅ Usuário encontrado:", user.name || user.email);

  // ============================================================
  // LIMPEZA
  // ============================================================
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

  // ============================================================
  // CATEGORIAS
  // ============================================================
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

  // ============================================================
  // TRANSAÇÕES — 12 meses de histórico (fev/2025 a fev/2026)
  // ============================================================
  console.log("💰 Criando transações (12 meses de histórico)...");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTransactions: any[] = [];

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    let month = currentMonth - monthOffset;
    let year = currentYear;
    while (month < 0) {
      month += 12;
      year -= 1;
    }

    // Para o mês atual, limitar as datas até hoje
    const maxDay = monthOffset === 0 ? currentDay : 28;

    // === RECEITAS ===

    // Salário (crescimento ao longo do ano: promoção em set/2025)
    const baseSalary = monthOffset >= 5 ? 8500 : 9200; // promoção ~5 meses atrás
    allTransactions.push({
      type: "income",
      value: String(baseSalary + randomBetween(-100, 100)),
      category: "Salário",
      description: "Salário mensal",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // Freelance (60% dos meses)
    if (Math.random() > 0.4) {
      const freelanceCount = randomInt(1, 3);
      for (let i = 0; i < freelanceCount; i++) {
        allTransactions.push({
          type: "income",
          value: String(randomBetween(900, 4000)),
          category: "Freelance",
          description: pickRandom([
            "Projeto web React",
            "Consultoria técnica",
            "Landing page",
            "Desenvolvimento API",
            "Design UI/UX",
            "App mobile",
          ]),
          date: getDateInMonth(year, month, randomInt(10, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // Dividendos (mensal — FIIs e ações)
    allTransactions.push({
      type: "income",
      value: String(randomBetween(180, 520)),
      category: "Dividendos",
      description: pickRandom(["Dividendos FIIs", "Dividendos ITUB4", "Dividendos BBAS3", "Rendimentos FIIs"]),
      date: getDateInMonth(year, month, 15),
      userId: USER_ID,
    });

    // Bônus (trimestral)
    if (month % 3 === 0 && Math.random() > 0.3) {
      allTransactions.push({
        type: "income",
        value: String(randomBetween(2000, 5000)),
        category: "Bônus",
        description: "Bônus trimestral",
        date: getDateInMonth(year, month, randomInt(20, maxDay)),
        userId: USER_ID,
      });
    }

    // Reembolsos
    if (Math.random() > 0.65) {
      allTransactions.push({
        type: "income",
        value: String(randomBetween(50, 600)),
        category: "Reembolso",
        description: pickRandom(["Reembolso empresa", "Cashback Nubank", "Devolução compra", "Reembolso médico"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // 13º salário (dezembro)
    if (month === 11) {
      allTransactions.push({
        type: "income",
        value: String(9200),
        category: "Salário",
        description: "13º salário",
        date: getDateInMonth(year, month, 20),
        userId: USER_ID,
      });
    }

    // Vendas esporádicas
    if (Math.random() > 0.8) {
      allTransactions.push({
        type: "income",
        value: String(randomBetween(100, 1200)),
        category: "Vendas",
        description: pickRandom(["Venda OLX", "Venda Enjoei", "Venda eletrônico usado"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === DESPESAS FIXAS ===

    // Aluguel
    allTransactions.push({
      type: "expense",
      value: String(2400),
      category: "Moradia",
      description: "Aluguel do apartamento",
      date: getDateInMonth(year, month, 10),
      userId: USER_ID,
    });

    // Condomínio
    allTransactions.push({
      type: "expense",
      value: String(randomBetween(450, 520)),
      category: "Moradia",
      description: "Taxa de condomínio",
      date: getDateInMonth(year, month, 15),
      userId: USER_ID,
    });

    // Internet
    allTransactions.push({
      type: "expense",
      value: String(139.90),
      category: "Serviços",
      description: "Internet fibra 600mb",
      date: getDateInMonth(year, month, 20),
      userId: USER_ID,
    });

    // Celular
    allTransactions.push({
      type: "expense",
      value: String(89.90),
      category: "Serviços",
      description: "Plano celular Vivo",
      date: getDateInMonth(year, month, 12),
      userId: USER_ID,
    });

    // Luz (sazonal — verão mais caro por ar condicionado)
    const isSummer = month === 0 || month === 1 || month === 11 || month === 2;
    allTransactions.push({
      type: "expense",
      value: String(randomBetween(isSummer ? 220 : 140, isSummer ? 380 : 240)),
      category: "Moradia",
      description: "Conta de luz",
      date: getDateInMonth(year, month, 18),
      userId: USER_ID,
    });

    // Água
    allTransactions.push({
      type: "expense",
      value: String(randomBetween(80, 130)),
      category: "Moradia",
      description: "Conta de água",
      date: getDateInMonth(year, month, 22),
      userId: USER_ID,
    });

    // Gás
    if (Math.random() > 0.25) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(50, 95)),
        category: "Moradia",
        description: "Gás encanado",
        date: getDateInMonth(year, month, 25),
        userId: USER_ID,
      });
    }

    // IPTU (parcelado jan-out)
    if (month >= 0 && month <= 9) {
      allTransactions.push({
        type: "expense",
        value: String(285),
        category: "Impostos",
        description: `IPTU parcela ${month + 1}/10`,
        date: getDateInMonth(year, month, 10),
        userId: USER_ID,
      });
    }

    // === ASSINATURAS ===
    const subscriptions = [
      { desc: "Netflix Premium", value: 59.90 },
      { desc: "Spotify Family", value: 34.90 },
      { desc: "Amazon Prime", value: 19.90 },
      { desc: "iCloud 200GB", value: 14.90 },
      { desc: "ChatGPT Plus", value: 104.00 },
      { desc: "GitHub Copilot", value: 50.00 },
      { desc: "Disney+", value: 33.90 },
    ];

    for (const sub of subscriptions) {
      allTransactions.push({
        type: "expense",
        value: String(sub.value),
        category: "Assinaturas",
        description: sub.desc,
        date: getDateInMonth(year, month, randomInt(5, 12)),
        userId: USER_ID,
      });
    }

    // Academia
    allTransactions.push({
      type: "expense",
      value: String(159.90),
      category: "Saúde",
      description: "Academia BlueFit",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // Plano de saúde
    allTransactions.push({
      type: "expense",
      value: String(489.90),
      category: "Saúde",
      description: "Plano de saúde Unimed",
      date: getDateInMonth(year, month, 8),
      userId: USER_ID,
    });

    // === ALIMENTAÇÃO ===

    // Supermercado
    const supermarketCount = randomInt(5, 10);
    const supermarkets = ["Supermercado Extra", "Carrefour", "Pão de Açúcar", "Assaí", "St Marche", "Hirota", "Oba Hortifruti"];
    for (let i = 0; i < supermarketCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(65, 520)),
        category: "Alimentação",
        description: pickRandom(supermarkets),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Delivery
    const deliveryCount = randomInt(8, 18);
    const deliveryApps = ["iFood", "Rappi", "Uber Eats", "Zé Delivery", "iFood"];
    for (let i = 0; i < deliveryCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(22, 105)),
        category: "Alimentação",
        description: `${pickRandom(deliveryApps)} - ${pickRandom(["Japonês", "Pizza", "Hambúrguer", "Árabe", "Mexicano", "Marmita", "Açaí", "Sushi", "Churrasco"])}`,
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Restaurantes
    const restaurantCount = randomInt(4, 8);
    for (let i = 0; i < restaurantCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(45, 220)),
        category: "Alimentação",
        description: pickRandom(["Almoço restaurante", "Jantar fora", "Happy Hour", "Brunch", "Padaria", "Lanchonete", "Rodízio", "Churrascaria"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Café
    const coffeeCount = randomInt(6, 14);
    for (let i = 0; i < coffeeCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(8, 38)),
        category: "Alimentação",
        description: pickRandom(["Starbucks", "Café especial", "Padaria", "Coffee Lab", "Café da manhã"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === TRANSPORTE ===

    // Uber/99
    const uberCount = randomInt(8, 20);
    for (let i = 0; i < uberCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(14, 60)),
        category: "Transporte",
        description: pickRandom(["Uber", "99", "Uber", "99Pop"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Combustível
    const gasCount = randomInt(2, 5);
    for (let i = 0; i < gasCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(180, 320)),
        category: "Transporte",
        description: pickRandom(["Posto Shell", "Posto Ipiranga", "Posto BR", "Posto Ale"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Estacionamento
    if (Math.random() > 0.35) {
      const parkingCount = randomInt(2, 7);
      for (let i = 0; i < parkingCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(10, 40)),
          category: "Transporte",
          description: "Estacionamento",
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // Manutenção do carro (esporádica)
    if (Math.random() > 0.8) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(200, 1200)),
        category: "Transporte",
        description: pickRandom(["Revisão carro", "Troca de óleo", "Pneu", "IPVA parcela", "Lavagem detalhada"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === SAÚDE ===

    // Farmácia
    const pharmacyCount = randomInt(1, 4);
    for (let i = 0; i < pharmacyCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(25, 200)),
        category: "Saúde",
        description: pickRandom(["Drogasil", "Droga Raia", "Pague Menos", "Drogaria São Paulo"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Consultas/exames
    if (Math.random() > 0.65) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(120, 500)),
        category: "Saúde",
        description: pickRandom(["Consulta médica", "Dentista", "Exames laboratoriais", "Oftalmologista", "Dermatologista"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === LAZER ===
    const leisureCount = randomInt(3, 7);
    const leisureOptions = [
      "Cinema", "Teatro", "Bar com amigos", "Show", "Parque de diversões",
      "Museu", "Escape room", "Boliche", "Karaokê", "Festival de música",
    ];
    for (let i = 0; i < leisureCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(35, 250)),
        category: "Lazer",
        description: pickRandom(leisureOptions),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Games
    if (Math.random() > 0.45) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(40, 350)),
        category: "Lazer",
        description: pickRandom(["Steam", "PlayStation Store", "Nintendo eShop", "Xbox Game Pass", "Epic Games"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === COMPRAS ===
    const shoppingCount = randomInt(2, 7);
    const stores = ["Amazon", "Mercado Livre", "Magazine Luiza", "Shopee", "AliExpress", "Americanas", "Kabum", "Fast Shop"];
    for (let i = 0; i < shoppingCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(45, 600)),
        category: "Compras",
        description: pickRandom(stores),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === PETS ===
    if (Math.random() > 0.25) {
      const petCount = randomInt(1, 4);
      for (let i = 0; i < petCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(60, 400)),
          category: "Pets",
          description: pickRandom(["Ração Golden", "Veterinário", "Pet shop", "Banho e tosa", "Petlove", "Vacina pet"]),
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // === VESTUÁRIO ===
    if (Math.random() > 0.35) {
      const clothingCount = randomInt(1, 3);
      const clothingStores = ["Renner", "C&A", "Riachuelo", "Zara", "Nike", "Adidas", "Centauro", "Netshoes", "Reserva"];
      for (let i = 0; i < clothingCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(70, 450)),
          category: "Vestuário",
          description: pickRandom(clothingStores),
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // === BELEZA ===
    if (Math.random() > 0.4) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(45, 220)),
        category: "Beleza",
        description: pickRandom(["Barbearia", "Cabeleireiro", "Manicure", "Skincare", "Perfumaria"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === EDUCAÇÃO ===
    if (Math.random() > 0.5) {
      const eduCount = randomInt(1, 3);
      for (let i = 0; i < eduCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(30, 280)),
          category: "Educação",
          description: pickRandom(["Udemy", "Alura", "Livro Amazon", "Curso Rocketseat", "Inglês", "Coursera", "Livro técnico"]),
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // === PRESENTES ===
    if (Math.random() > 0.7) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(60, 400)),
        category: "Presentes",
        description: pickRandom(["Presente aniversário", "Presente namorada", "Amigo secreto", "Presente dia das mães", "Presente casamento"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // === VIAGEM (esporádica) ===
    if (Math.random() > 0.85) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(800, 3500)),
        category: "Viagem",
        description: pickRandom(["Passagem aérea", "Hotel Booking", "Airbnb", "Passeio turístico"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }
  }

  console.log(`   Inserindo ${allTransactions.length} transações...`);
  await prisma.transaction.createMany({ data: allTransactions });

  // ============================================================
  // TEMPLATES
  // ============================================================
  console.log("📋 Criando templates...");

  const templates = [
    { name: "Almoço", description: "Almoço no trabalho", category: "Alimentação", type: "expense" as const, value: "38" },
    { name: "Uber Casa", description: "Uber para casa", category: "Transporte", type: "expense" as const, value: "28" },
    { name: "Uber Trabalho", description: "Uber para o escritório", category: "Transporte", type: "expense" as const, value: "32" },
    { name: "Supermercado", description: "Compras do mês", category: "Alimentação", type: "expense" as const, value: null },
    { name: "iFood", description: "Delivery almoço/jantar", category: "Alimentação", type: "expense" as const, value: null },
    { name: "Freelance", description: "Projeto freelance", category: "Freelance", type: "income" as const, value: null },
    { name: "Pix Recebido", description: "Transferência recebida", category: "Outros", type: "income" as const, value: null },
    { name: "Café", description: "Café da tarde", category: "Alimentação", type: "expense" as const, value: "18" },
    { name: "Farmácia", description: "Compra farmácia", category: "Saúde", type: "expense" as const, value: null },
    { name: "Combustível", description: "Abastecimento", category: "Transporte", type: "expense" as const, value: "250" },
    { name: "Dividendos", description: "Dividendos recebidos", category: "Dividendos", type: "income" as const, value: null },
    { name: "Barbearia", description: "Corte de cabelo", category: "Beleza", type: "expense" as const, value: "65" },
  ];

  await prisma.transactionTemplate.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: templates.map(t => ({ ...t, usageCount: randomInt(5, 45), userId: USER_ID })) as any,
  });

  // ============================================================
  // ORÇAMENTOS
  // ============================================================
  console.log("📊 Criando orçamentos...");

  const budgets = [
    { category: "Alimentação", limit: "2800" },
    { category: "Transporte", limit: "1200" },
    { category: "Lazer", limit: "700" },
    { category: "Compras", limit: "900" },
    { category: "Assinaturas", limit: "400" },
    { category: "Saúde", limit: "800" },
    { category: "Vestuário", limit: "450" },
    { category: "Pets", limit: "350" },
    { category: "Educação", limit: "300" },
    { category: "Beleza", limit: "250" },
  ];

  await prisma.budget.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: budgets.map(b => ({ ...b, month: 0, year: 0, userId: USER_ID })) as any,
  });

  // ============================================================
  // DESPESAS RECORRENTES
  // ============================================================
  console.log("🔄 Criando despesas recorrentes...");

  const recurringExpenses = [
    { description: "Aluguel", value: "2400", category: "Moradia", dueDay: 10 },
    { description: "Condomínio", value: "480", category: "Moradia", dueDay: 15 },
    { description: "Internet fibra 600mb", value: "139.90", category: "Serviços", dueDay: 20 },
    { description: "Celular Vivo", value: "89.90", category: "Serviços", dueDay: 12 },
    { description: "Netflix Premium", value: "59.90", category: "Assinaturas", dueDay: 8 },
    { description: "Spotify Family", value: "34.90", category: "Assinaturas", dueDay: 8 },
    { description: "Amazon Prime", value: "19.90", category: "Assinaturas", dueDay: 8 },
    { description: "Disney+", value: "33.90", category: "Assinaturas", dueDay: 10 },
    { description: "Academia BlueFit", value: "159.90", category: "Saúde", dueDay: 5 },
    { description: "Plano saúde Unimed", value: "489.90", category: "Saúde", dueDay: 8 },
    { description: "iCloud 200GB", value: "14.90", category: "Assinaturas", dueDay: 15 },
    { description: "ChatGPT Plus", value: "104.00", category: "Assinaturas", dueDay: 10 },
    { description: "GitHub Copilot", value: "50.00", category: "Assinaturas", dueDay: 10 },
  ];

  await prisma.recurringExpense.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: recurringExpenses.map(e => ({ ...e, isActive: true, userId: USER_ID })) as any,
  });

  // ============================================================
  // INVESTIMENTOS
  // ============================================================
  console.log("📈 Criando investimentos com operações...");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allOperations: any[] = [];

  // --- AÇÕES ---
  const stocks = [
    { name: "Petrobras", ticker: "PETR4", ops: [
      { date: 350, type: "buy", qty: 100, price: 29.80 },
      { date: 260, type: "buy", qty: 80, price: 33.50 },
      { date: 150, type: "buy", qty: 60, price: 36.20 },
      { date: 60, type: "sell", qty: 40, price: 41.00 },
    ], currentPrice: 39.50 },
    { name: "Vale", ticker: "VALE3", ops: [
      { date: 340, type: "buy", qty: 70, price: 72.00 },
      { date: 200, type: "buy", qty: 50, price: 66.50 },
      { date: 80, type: "sell", qty: 20, price: 70.00 },
    ], currentPrice: 64.80 },
    { name: "Itaú Unibanco", ticker: "ITUB4", ops: [
      { date: 360, type: "buy", qty: 120, price: 25.00 },
      { date: 240, type: "buy", qty: 80, price: 28.50 },
      { date: 100, type: "buy", qty: 60, price: 31.00 },
    ], currentPrice: 33.40 },
    { name: "Banco do Brasil", ticker: "BBAS3", ops: [
      { date: 320, type: "buy", qty: 50, price: 40.00 },
      { date: 180, type: "buy", qty: 40, price: 47.00 },
      { date: 60, type: "buy", qty: 30, price: 52.50 },
    ], currentPrice: 54.00 },
    { name: "WEG", ticker: "WEGE3", ops: [
      { date: 300, type: "buy", qty: 50, price: 36.00 },
      { date: 150, type: "buy", qty: 30, price: 41.50 },
    ], currentPrice: 46.20 },
    { name: "Ambev", ticker: "ABEV3", ops: [
      { date: 280, type: "buy", qty: 200, price: 12.80 },
      { date: 120, type: "buy", qty: 100, price: 13.50 },
    ], currentPrice: 12.20 },
    { name: "B3", ticker: "B3SA3", ops: [
      { date: 250, type: "buy", qty: 100, price: 11.50 },
      { date: 100, type: "buy", qty: 60, price: 13.00 },
    ], currentPrice: 13.80 },
    { name: "Rede D'Or", ticker: "RDOR3", ops: [
      { date: 200, type: "buy", qty: 40, price: 25.00 },
      { date: 80, type: "buy", qty: 30, price: 28.50 },
    ], currentPrice: 30.20 },
  ];

  for (const stock of stocks) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of stock.ops) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "stock",
        name: stock.name,
        ticker: stock.ticker,
        institution: "XP Investimentos",
        quantity: String(totalQty),
        averagePrice: String(averagePrice),
        currentPrice: String(stock.currentPrice),
        totalInvested: String(totalCost),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        userId: USER_ID,
      } as any,
    });

    for (const op of stock.ops) {
      allOperations.push({
        investmentId: investment.id,
        type: op.type,
        quantity: String(op.qty),
        price: String(op.price),
        total: String(op.qty * op.price),
        date: getDate(op.date),
        fees: String(op.qty * op.price * 0.0003),
      });
    }
  }

  // --- FIIs ---
  const fiis = [
    { name: "HGLG11", ticker: "HGLG11", ops: [
      { date: 340, type: "buy", qty: 20, price: 162.00 },
      { date: 220, type: "buy", qty: 15, price: 167.00 },
      { date: 100, type: "buy", qty: 10, price: 160.00 },
    ], currentPrice: 164.50 },
    { name: "XPLG11", ticker: "XPLG11", ops: [
      { date: 300, type: "buy", qty: 35, price: 96.00 },
      { date: 160, type: "buy", qty: 25, price: 101.00 },
      { date: 50, type: "buy", qty: 20, price: 99.50 },
    ], currentPrice: 103.20 },
    { name: "MXRF11", ticker: "MXRF11", ops: [
      { date: 280, type: "buy", qty: 120, price: 10.30 },
      { date: 150, type: "buy", qty: 100, price: 10.60 },
      { date: 40, type: "buy", qty: 80, price: 10.40 },
    ], currentPrice: 10.55 },
    { name: "KNRI11", ticker: "KNRI11", ops: [
      { date: 320, type: "buy", qty: 20, price: 136.00 },
      { date: 180, type: "buy", qty: 15, price: 141.00 },
    ], currentPrice: 143.50 },
    { name: "VISC11", ticker: "VISC11", ops: [
      { date: 260, type: "buy", qty: 30, price: 112.00 },
      { date: 120, type: "buy", qty: 20, price: 116.00 },
    ], currentPrice: 119.80 },
    { name: "BTLG11", ticker: "BTLG11", ops: [
      { date: 200, type: "buy", qty: 25, price: 99.00 },
      { date: 80, type: "buy", qty: 20, price: 103.50 },
    ], currentPrice: 106.00 },
  ];

  for (const fii of fiis) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of fii.ops) {
      totalCost += op.qty * op.price;
      totalQty += op.qty;
    }

    const averagePrice = totalCost / totalQty;
    const currentValue = totalQty * fii.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = (profitLoss / totalCost) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "fii",
        name: fii.name,
        ticker: fii.ticker,
        institution: "XP Investimentos",
        quantity: String(totalQty),
        averagePrice: String(averagePrice),
        currentPrice: String(fii.currentPrice),
        totalInvested: String(totalCost),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        userId: USER_ID,
      } as any,
    });

    for (const op of fii.ops) {
      allOperations.push({
        investmentId: investment.id,
        type: "buy",
        quantity: String(op.qty),
        price: String(op.price),
        total: String(op.qty * op.price),
        date: getDate(op.date),
        fees: String(op.qty * op.price * 0.0003),
      });
    }
  }

  // --- CDBs ---
  const cdbs = [
    { name: "CDB Banco Inter 110% CDI", institution: "Banco Inter", deposits: [
      { date: 340, value: 6000 },
      { date: 200, value: 5000 },
      { date: 80, value: 4000 },
    ], interestRate: 110, indexer: "CDI", maturityMonths: 24 },
    { name: "CDB Nubank 100% CDI", institution: "Nubank", deposits: [
      { date: 280, value: 4000 },
      { date: 120, value: 3000 },
    ], interestRate: 100, indexer: "CDI", maturityMonths: 12 },
    { name: "CDB BTG IPCA+6.5%", institution: "BTG Pactual", deposits: [
      { date: 350, value: 12000 },
      { date: 160, value: 8000 },
    ], interestRate: 6.5, indexer: "IPCA", maturityMonths: 36 },
    { name: "CDB C6 Bank 103% CDI", institution: "C6 Bank", deposits: [
      { date: 150, value: 5000 },
      { date: 50, value: 3000 },
    ], interestRate: 103, indexer: "CDI", maturityMonths: 24 },
  ];

  for (const cdb of cdbs) {
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + cdb.maturityMonths);

    let totalInvested = 0;
    for (const dep of cdb.deposits) totalInvested += dep.value;

    const avgDaysHeld = cdb.deposits.reduce((acc, d) => acc + d.date, 0) / cdb.deposits.length;
    const monthlyRate = cdb.indexer === "CDI" ? 0.0098 : 0.0082;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + monthlyRate * (cdb.interestRate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "cdb",
        name: cdb.name,
        institution: cdb.institution,
        totalInvested: String(totalInvested),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        interestRate: String(cdb.interestRate),
        indexer: cdb.indexer,
        maturityDate,
        userId: USER_ID,
      } as any,
    });

    for (const dep of cdb.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: String(1),
        price: String(dep.value),
        total: String(dep.value),
        date: getDate(dep.date),
        fees: String(0),
      });
    }
  }

  // --- Tesouro Direto ---
  const treasuryData = [
    { name: "Tesouro Selic 2029", indexer: "SELIC", rate: 100, deposits: [
      { date: 360, value: 6000 },
      { date: 220, value: 5000 },
      { date: 100, value: 4000 },
    ], maturity: new Date(2029, 0, 1) },
    { name: "Tesouro IPCA+ 2035", indexer: "IPCA", rate: 6.5, deposits: [
      { date: 300, value: 10000 },
      { date: 150, value: 6000 },
    ], maturity: new Date(2035, 5, 15) },
  ];

  for (const treasury of treasuryData) {
    let totalInvested = 0;
    for (const dep of treasury.deposits) totalInvested += dep.value;

    const avgDaysHeld = treasury.deposits.reduce((acc, d) => acc + d.date, 0) / treasury.deposits.length;
    const monthlyRate = treasury.indexer === "SELIC" ? 0.0098 : 0.0085;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + monthlyRate * (treasury.rate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "treasury",
        name: treasury.name,
        institution: "Tesouro Direto",
        totalInvested: String(totalInvested),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        interestRate: String(treasury.rate),
        indexer: treasury.indexer,
        maturityDate: treasury.maturity,
        userId: USER_ID,
      } as any,
    });

    for (const dep of treasury.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: String(1),
        price: String(dep.value),
        total: String(dep.value),
        date: getDate(dep.date),
        fees: String(0),
      });
    }
  }

  // --- LCI/LCA ---
  const lciLca = [
    { name: "LCI Banco Inter 95% CDI", institution: "Banco Inter", deposits: [
      { date: 250, value: 8000 },
    ], interestRate: 95, indexer: "CDI", maturityMonths: 12 },
    { name: "LCA BTG 92% CDI", institution: "BTG Pactual", deposits: [
      { date: 180, value: 10000 },
    ], interestRate: 92, indexer: "CDI", maturityMonths: 12 },
  ];

  for (const item of lciLca) {
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + item.maturityMonths);

    let totalInvested = 0;
    for (const dep of item.deposits) totalInvested += dep.value;

    const avgDaysHeld = item.deposits.reduce((acc, d) => acc + d.date, 0) / item.deposits.length;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + 0.0098 * (item.interestRate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "lci_lca",
        name: item.name,
        institution: item.institution,
        totalInvested: String(totalInvested),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        interestRate: String(item.interestRate),
        indexer: item.indexer,
        maturityDate,
        userId: USER_ID,
      } as any,
    });

    for (const dep of item.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: String(1),
        price: String(dep.value),
        total: String(dep.value),
        date: getDate(dep.date),
        fees: String(0),
      });
    }
  }

  // --- Poupança ---
  const savingsDeposits = [
    { date: 360, value: 2000 },
    { date: 300, value: 1500 },
    { date: 240, value: 1500 },
    { date: 180, value: 1000 },
    { date: 120, value: 1000 },
  ];

  let savingsTotal = 0;
  for (const dep of savingsDeposits) savingsTotal += dep.value;
  const savingsCurrentValue = savingsTotal * 1.045; // ~4.5% ao ano rendimento

  const savingsInvestment = await prisma.investment.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      type: "savings",
      name: "Poupança Nubank",
      institution: "Nubank",
      totalInvested: String(savingsTotal),
      currentValue: String(savingsCurrentValue),
      profitLoss: String(savingsCurrentValue - savingsTotal),
      profitLossPercent: String(((savingsCurrentValue - savingsTotal) / savingsTotal) * 100),
      userId: USER_ID,
    } as any,
  });

  for (const dep of savingsDeposits) {
    allOperations.push({
      investmentId: savingsInvestment.id,
      type: "deposit",
      quantity: String(1),
      price: String(dep.value),
      total: String(dep.value),
      date: getDate(dep.date),
      fees: String(0),
    });
  }

  // --- Cripto ---
  const cryptos = [
    { name: "Bitcoin", ticker: "BTC", ops: [
      { date: 350, type: "buy", qty: 0.025, price: 155000 },
      { date: 240, type: "buy", qty: 0.035, price: 185000 },
      { date: 120, type: "buy", qty: 0.02, price: 210000 },
      { date: 50, type: "sell", qty: 0.01, price: 220000 },
    ], currentPrice: 205000 },
    { name: "Ethereum", ticker: "ETH", ops: [
      { date: 300, type: "buy", qty: 0.4, price: 10500 },
      { date: 180, type: "buy", qty: 0.5, price: 12500 },
      { date: 80, type: "buy", qty: 0.3, price: 14500 },
    ], currentPrice: 14000 },
    { name: "Solana", ticker: "SOL", ops: [
      { date: 180, type: "buy", qty: 8, price: 130 },
      { date: 80, type: "buy", qty: 10, price: 165 },
    ], currentPrice: 190 },
  ];

  for (const crypto of cryptos) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of crypto.ops) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "crypto",
        name: crypto.name,
        ticker: crypto.ticker,
        institution: "Binance",
        quantity: String(totalQty),
        averagePrice: String(averagePrice),
        currentPrice: String(crypto.currentPrice),
        totalInvested: String(totalCost),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        userId: USER_ID,
      } as any,
    });

    for (const op of crypto.ops) {
      allOperations.push({
        investmentId: investment.id,
        type: op.type,
        quantity: String(op.qty),
        price: String(op.price),
        total: String(op.qty * op.price),
        date: getDate(op.date),
        fees: String(op.qty * op.price * 0.001),
      });
    }
  }

  console.log(`   Inserindo ${allOperations.length} operações...`);
  await prisma.operation.createMany({ data: allOperations });

  // ============================================================
  // CARTÕES DE CRÉDITO
  // ============================================================
  console.log("💳 Criando cartões de crédito com faturas...");

  const nubank = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "Nubank Ultravioleta",
      lastDigits: "8421",
      limit: "20000",
      closingDay: 3,
      dueDay: 10,
      color: "#8B5CF6",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const inter = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "Inter Black",
      lastDigits: "5673",
      limit: "12000",
      closingDay: 15,
      dueDay: 22,
      color: "#F97316",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const c6 = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "C6 Carbon",
      lastDigits: "3190",
      limit: "15000",
      closingDay: 20,
      dueDay: 27,
      color: "#1F2937",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const xp = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "XP Visa Infinite",
      lastDigits: "7654",
      limit: "30000",
      closingDay: 8,
      dueDay: 15,
      color: "#10B981",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const cards = [
    { card: nubank, avgSpend: 4500 },
    { card: inter, avgSpend: 2200 },
    { card: c6, avgSpend: 2800 },
    { card: xp, avgSpend: 4000 },
  ];

  const purchaseCategories = [
    { category: "Alimentação", descriptions: ["iFood", "Rappi", "Restaurante Outback", "Supermercado Extra", "Burger King", "McDonald's", "Starbucks", "Sushi Leblon", "Padaria Bella Paulista"], minValue: 18, maxValue: 380 },
    { category: "Compras", descriptions: ["Amazon", "Mercado Livre", "Magazine Luiza", "AliExpress", "Shopee", "Kabum", "Americanas", "Fast Shop", "Casas Bahia"], minValue: 45, maxValue: 900 },
    { category: "Transporte", descriptions: ["Uber", "99", "Posto Shell", "Posto Ipiranga", "Estacionamento", "Pedágio"], minValue: 12, maxValue: 280 },
    { category: "Lazer", descriptions: ["Cinema Cinemark", "Ingresso.com", "Steam", "PlayStation Store", "Spotify", "Netflix", "Bar do Juarez"], minValue: 20, maxValue: 250 },
    { category: "Assinaturas", descriptions: ["Spotify Premium", "Netflix", "Disney+", "HBO Max", "Amazon Prime", "YouTube Premium", "Apple Music"], minValue: 15, maxValue: 70 },
    { category: "Viagem", descriptions: ["Booking.com", "Airbnb", "Decolar", "LATAM Airlines", "GOL", "Hotel Ibis", "Azul Linhas Aéreas"], minValue: 200, maxValue: 2500 },
    { category: "Vestuário", descriptions: ["Renner", "C&A", "Zara", "Nike", "Adidas", "Centauro", "Reserva"], minValue: 80, maxValue: 550 },
    { category: "Saúde", descriptions: ["Drogasil", "Droga Raia", "Consulta médica", "Farmácia", "Drogaria São Paulo"], minValue: 25, maxValue: 350 },
    { category: "Educação", descriptions: ["Udemy", "Alura", "Livraria Cultura", "Amazon Livros"], minValue: 30, maxValue: 200 },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPurchases: any[] = [];
  const invoiceUpdates: Array<{ id: string; total: number }> = [];

  for (const { card, avgSpend } of cards) {
    // 12 meses de faturas
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
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
      // Um mês com overdue para ter alerta
      else if (monthOffset === 2 && card === inter) status = "overdue";

      const paidAmount = status === "paid" ? String(avgSpend * randomBetween(0.85, 1.15)) : (status === "overdue" ? String(0) : String(0));

      const invoice = await prisma.invoice.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          creditCardId: card.id,
          month: month + 1,
          year,
          closingDate,
          dueDate,
          status,
          total: String(0),
          paidAmount,
        } as any,
      });

      let invoiceTotal = 0;
      const purchaseCount = randomInt(10, 25);

      for (let i = 0; i < purchaseCount; i++) {
        const catInfo = pickRandom(purchaseCategories);
        const description = pickRandom(catInfo.descriptions);
        const value = randomBetween(catInfo.minValue, catInfo.maxValue);

        const isInstallment = Math.random() > 0.7;
        const installments = isInstallment ? pickRandom([2, 3, 4, 6, 8, 10, 12]) : 1;
        const installmentValue = Math.round((value / installments) * 100) / 100;

        allPurchases.push({
          invoiceId: invoice.id,
          description,
          value: String(installmentValue),
          totalValue: String(value),
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

  console.log(`   Inserindo ${allPurchases.length} compras...`);
  await prisma.purchase.createMany({ data: allPurchases });

  // Atualizar totais das faturas
  for (const update of invoiceUpdates) {
    await prisma.invoice.update({
      where: { id: update.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { total: String(update.total) } as any,
    });
  }

  // ============================================================
  // METAS FINANCEIRAS
  // ============================================================
  console.log("🎯 Criando metas financeiras com contribuições...");

  const goals: Array<{
    name: string;
    description: string;
    category: GoalCategory;
    targetValue: number;
    currentValue: number;
    targetDate: Date;
    color: string;
    icon: string;
    contributions: number;
  }> = [
    {
      name: "Reserva de Emergência",
      description: "6 meses de despesas para proteção financeira",
      category: GoalCategory.emergency,
      targetValue: 45000,
      currentValue: 32000,
      targetDate: new Date(currentYear + 1, 5, 30),
      color: "#10B981",
      icon: "Shield",
      contributions: 12,
    },
    {
      name: "Viagem Japão 2028",
      description: "Férias de 3 semanas no Japão — Tokyo, Kyoto, Osaka",
      category: GoalCategory.travel,
      targetValue: 40000,
      currentValue: 14500,
      targetDate: new Date(2028, 3, 1),
      color: "#3B82F6",
      icon: "Plane",
      contributions: 8,
    },
    {
      name: "Troca do Carro",
      description: "Entrada para um SUV — HRV ou Creta",
      category: GoalCategory.car,
      targetValue: 65000,
      currentValue: 22000,
      targetDate: new Date(currentYear + 2, 6, 1),
      color: "#F97316",
      icon: "Car",
      contributions: 10,
    },
    {
      name: "MBA em Engenharia de Software",
      description: "Pós-graduação na FIAP ou PUC",
      category: GoalCategory.education,
      targetValue: 48000,
      currentValue: 9800,
      targetDate: new Date(currentYear + 1, 7, 1),
      color: "#8B5CF6",
      icon: "GraduationCap",
      contributions: 6,
    },
    {
      name: "Entrada Apartamento",
      description: "20% de entrada para financiamento de apê próprio",
      category: GoalCategory.house,
      targetValue: 200000,
      currentValue: 48000,
      targetDate: new Date(currentYear + 4, 0, 1),
      color: "#EC4899",
      icon: "Home",
      contributions: 12,
    },
    {
      name: "Aposentadoria Antecipada",
      description: "Complemento previdência para se aposentar aos 50",
      category: GoalCategory.retirement,
      targetValue: 600000,
      currentValue: 42000,
      targetDate: new Date(currentYear + 20, 0, 1),
      color: "#6366F1",
      icon: "TrendingUp",
      contributions: 12,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allContributions: any[] = [];

  for (const goalData of goals) {
    const goal = await prisma.financialGoal.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        name: goalData.name,
        description: goalData.description,
        category: goalData.category,
        targetValue: String(goalData.targetValue),
        currentValue: String(goalData.currentValue),
        targetDate: goalData.targetDate,
        color: goalData.color,
        icon: goalData.icon,
        userId: USER_ID,
      } as any,
    });

    const avgContribution = goalData.currentValue / goalData.contributions;
    for (let i = 0; i < goalData.contributions; i++) {
      const contribValue = avgContribution * randomBetween(0.7, 1.3);
      allContributions.push({
        goalId: goal.id,
        value: String(Math.round(contribValue * 100) / 100),
        date: getDate(i * 28 + randomInt(0, 14)),
        notes: i === 0
          ? "Aporte inicial"
          : Math.random() > 0.75
            ? pickRandom(["Bônus do mês", "Sobra do mês", "Freelance extra", "Rendimento investimento", "13º salário"])
            : null,
      });
    }
  }

  console.log(`   Inserindo ${allContributions.length} contribuições em metas...`);
  await prisma.goalContribution.createMany({ data: allContributions });

  // ============================================================
  // RESUMO
  // ============================================================
  console.log("");
  console.log("✅ Seed concluído com sucesso!");
  console.log("");
  console.log("📊 Resumo dos dados criados:");
  console.log("   • Categorias: 26 (16 despesas + 10 receitas)");
  console.log(`   • Transações: ${allTransactions.length}`);
  console.log(`   • Templates: ${templates.length}`);
  console.log(`   • Orçamentos: ${budgets.length}`);
  console.log(`   • Despesas Recorrentes: ${recurringExpenses.length}`);
  console.log(`   • Investimentos: ${stocks.length + fiis.length + cdbs.length + treasuryData.length + lciLca.length + 1 + cryptos.length} (ações, FIIs, CDBs, Tesouro, LCI/LCA, Poupança, Cripto)`);
  console.log(`   • Operações de investimento: ${allOperations.length}`);
  console.log(`   • Cartões de Crédito: 4 (com 12 meses de faturas cada)`);
  console.log(`   • Compras no cartão: ${allPurchases.length}`);
  console.log(`   • Metas Financeiras: ${goals.length}`);
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

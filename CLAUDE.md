# FinControl — Contexto do Projeto

Sistema de gestão financeira pessoal. Interface em português (pt-BR).

## Stack

- **Framework:** Next.js 16 + React 19 + TypeScript 5
- **Database:** PostgreSQL (Supabase) via Prisma 6
- **Auth:** NextAuth v5 (beta 30)
- **State:** Zustand 5 (stores) + React Context (theme, sidebar, user, preferences, appearance)
- **Forms:** React Hook Form + Zod 4
- **UI:** Tailwind CSS 4 (sem config file, usa PostCSS) + Radix UI + Lucide icons
- **Charts:** Recharts 3
- **Export:** ExcelJS, jsPDF, html2canvas
- **Email:** Resend + Nodemailer
- **Cotacoes:** BRAPI (mercado brasileiro)

## Estrutura src/

```
app/                  # App Router (pages + API routes)
  (auth)/             # Login, register, forgot/reset-password
  conta/              # Settings (perfil, aparencia, geral, configuracoes, data, privacidade)
  cartoes/            # Credit cards page
  investimentos/      # Investments page
  relatorios/         # Reports page
  api/                # ~46 API routes (REST)
  page.tsx            # Dashboard principal
components/           # 15 pastas, ~77 componentes
  auth/               # Auth forms
  budget/             # Budget management
  cards/              # Credit card components
  categories/         # Category selection/management
  dashboard/          # Charts, summary cards, health score, calendar
  filters/            # Transaction filters
  forms/              # Transaction modal
  goals/              # Financial goals
  investments/        # Investment components
  layout/             # Sidebar, BottomTabs, AppShell, Footer
  providers/          # Context providers wrapper
  quick-transaction/  # FAB + templates
  recurring/          # Recurring expenses
  reports/            # Report generation
  ui/                 # Base UI (buttons, inputs, collapsible, modal, etc.)
contexts/             # 5 contexts (theme, user, sidebar, preferences, appearance)
hooks/                # 10 hooks (use-fetch, use-feedback, use-pagination, use-modal-state, use-available-balance, data fetching hooks)
lib/                  # 18 utils (auth, prisma, api-utils, rate-limit, store-utils, openapi, etc.)
store/                # 5 Zustand stores (transaction, template, category, card, investments)
types/                # Type definitions
middleware.ts         # Auth middleware
```

## Layout

- **Desktop:** Sidebar fixa esquerda (240px, colapsavel para 64px via localStorage)
- **Mobile:** Header simplificado + Bottom tabs (5 itens: Home, Invest., Cartoes, Relat., Mais)
- **Orquestrador:** `AppShell` controla sidebar + header + content + bottom tabs
- **Auth pages:** Sem sidebar/tabs (layout isolado)
- **Content width:** `max-w-screen-2xl` nas paginas principais, `max-w-2xl`/`max-w-4xl` em /conta

## Database (Prisma Models)

| Model | Descricao |
|-------|-----------|
| User | Usuario com settings JSON (general, notification, privacy) |
| PasswordResetToken | Tokens de reset de senha |
| Transaction | Receitas e despesas |
| Category | Categorias customizaveis + defaults |
| TransactionTemplate | Templates para transacoes rapidas |
| Investment | Acoes, FIIs, ETFs, crypto, CDB, tesouro, LCI/LCA, poupanca |
| Operation | Compra/venda/deposito/resgate de investimentos |
| CreditCard | Cartoes de credito |
| Invoice | Faturas mensais (open, closed, paid, overdue) |
| Purchase | Compras no cartao (suporta parcelamento) |
| Budget | Orcamentos por categoria (mensal/fixo) |
| RecurringExpense | Despesas fixas recorrentes |
| FinancialGoal | Metas (emergencia, viagem, carro, casa, educacao, aposentadoria) |
| GoalContribution | Aportes em metas |

## Dashboard (page.tsx)

Ordem dos componentes:
1. **QuickStats** — cards rapidos no topo
2. **SummaryCards** — receitas, despesas, saldo do mes
3. **Grid 3 colunas:**
   - MonthlyChart (2/3) + CategoryChart (1/3)
   - WealthEvolutionChart (2/3) + FinancialHealthScore (1/3)
4. **CollapsibleSection "Planejamento"** — BudgetSection + RecurringSection
5. **CollapsibleSection "Transacoes"** — TemplateSection + TransactionList
6. **QuickActionButtons** — FAB flutuante (+ receita / + despesa)

### Graficos do Dashboard

**MonthlyChart (Evolucao Financeira):**
- Mostra receitas vs despesas ao longo do tempo
- Periodos: 1w (7 dias), 1m (30 dias), 3m, 6m, 1y
- Agrupamento: por dia (≤30 dias) ou por mes (>30 dias)
- Type: `EvolutionPeriod = "1w" | "1m" | "3m" | "6m" | "1y"`

**WealthEvolutionChart (Evolucao Patrimonial):**
- Calcula patrimonio total = saldo + investido + metas - dividas
- Mostra 4 linhas: saldo (transacoes), investido (operations), metas (goals), dividas (invoices)
- Periodos: mesmos do MonthlyChart
- Agrupamento: por dia para 1w/1m, por mes para 3m/6m/1y
- API: `/api/wealth-evolution?period={period}`

## Pagina de Cartoes (cartoes/page.tsx)

Ordem dos componentes:
1. **Header** — titulo + botoes (Atualizar, Nova Compra, Novo Cartao)
2. **SummaryCards** — 4 cards: Limite Total, Disponivel, Fatura Atual, Proxima Fatura
3. **View Mode Tabs** — "Todos os Cartoes" / "Por Cartao"
4. **Grid 2 colunas:**
   - CardList (lista de cartoes)
   - InvoicePreviewChart (previsao de faturas)
5. **InvoiceDetail** — detalhes da fatura (apenas em modo "Por Cartao")
6. **CardAnalytics** — alertas + grid (Evolucao Mensal + Gastos por Categoria)

### CardAnalytics

- **Alertas:** pagamento proximo, fatura fechando, uso alto do limite
- **Evolucao Mensal:** grafico de barras (2 meses anteriores + atual + 3 futuros)
  - Meses passados: soma compras realizadas
  - Meses futuros: total da fatura (inclui parcelas)
  - Mostra media mensal no header
- **Gastos por Categoria:** top 6 categorias com barras de progresso

## Theming

- CSS variables em globals.css (--bg-primary, --card-bg, --text-primary, --border-color, etc.)
- Dois temas: dark (default) e light
- Primary color: `#8B5CF6` (violet)
- Secondary color: `#6366F1` (indigo)
- Toggle via `useTheme()` context, persistido em localStorage

## Padroes do Codigo

- Componentes sempre com `"use client"` quando usam hooks/state
- API routes retornam `NextResponse.json()` com tratamento de auth via `auth()`
- Stores Zustand fazem fetch direto nas APIs (`/api/...`)
- Estilo inline com `style={{ color: "var(--text-primary)" }}` para CSS variables
- Tailwind classes para layout, spacing, responsividade
- Icones sempre via `lucide-react`
- Formatacao monetaria via `formatCurrency()` de `@/lib/utils`
- Formularios com React Hook Form + Zod schema validation
- **Prisma Client:** Singleton pattern em `@/lib/prisma` com connection pooling e cleanup handlers
- **Connection Pooling:** DATABASE_URL usa PgBouncer (porta 6543) com limite de 5 conexões

## Preferencias do Usuario

O contexto `PreferencesContext` gerencia configuracoes do usuario:

**General Settings:**
- `defaultPage`: Pagina inicial (dashboard, cards, investments)
- `defaultPeriod`: Periodo padrao dos graficos (week, month, quarter, year)
- `defaultSort`: Ordenacao padrao (recent, oldest, highest, lowest)
- `confirmBeforeDelete`: Confirmacao antes de excluir

**Notification Settings:** Alertas de orcamento, lembretes de contas, relatorios

**Privacy Settings:** Ocultar valores, auto-lock

Os graficos do dashboard respeitam `defaultPeriod`:
- "week" → 1 semana (7 dias, agrupado por dia)
- "month" → 30 dias (agrupado por dia)
- "quarter" → 3 meses (agrupado por mes)
- "year" → 1 ano (agrupado por mes)

Opcoes disponiveis nos graficos: **1 Semana, 30 Dias, 3 Meses, 6 Meses, 1 Ano**

## Seguranca - Modo Discreto

O modo discreto (`hideValues`) oculta valores financeiros com "•••••".

**Comportamento ao desativar:**
- Requer confirmacao de senha via modal
- API: `POST /api/auth/verify-password` com `{ password }` retorna `{ valid: boolean }`
- Apos verificar senha, sessao fica "desbloqueada" (estado React `sessionUnlocked`)
- Na mesma sessao, pode ligar/desligar sem pedir senha novamente
- Ao recarregar pagina ou fazer logout, volta a exigir senha

**Arquivos:**
- `src/app/conta/privacidade/page.tsx` — toggle com modal de senha
- `src/app/api/auth/verify-password/route.ts` — validacao com bcrypt

## Variaveis de Ambiente

```
# Database (com connection pooling)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://user:pass@host:5432/db"  # Direct connection (migrations)

BRAPI_API_KEY         # Cotacoes de acoes
NEXTAUTH_SECRET       # Auth secret
NEXTAUTH_URL          # Auth callback URL
RESEND_API_KEY        # Email service
```

**Notas importantes:**
- DATABASE_URL usa porta **6543** (PgBouncer pooler) com `connection_limit=5`
- DIRECT_URL usa porta **5432** (conexao direta para migrations)

## APIs Importantes

### `/api/wealth-evolution?period={period}`

Calcula evolucao patrimonial ao longo do tempo.

**Logica:**
1. Busca transacoes, operacoes, faturas e metas desde `startDate`
2. Calcula saldos iniciais (tudo antes de `startDate`)
3. Cria pontos de dados:
   - **Por dia** se period = "1w" ou "1m" (7 ou 30 pontos)
   - **Por mes** se period = "3m", "6m" ou "1y"
4. Para cada ponto, calcula acumulado:
   - `transactionBalance`: saldo de transacoes (income - expense)
   - `investmentValue`: valor investido (buy/deposit - sell/withdraw)
   - `goalsSaved`: soma de todas as metas (valor atual)
   - `cardDebt`: dividas de faturas nao pagas ate aquela data
   - `totalWealth`: transactionBalance + investmentValue + goalsSaved - cardDebt

**Retorno:**
```typescript
{
  evolution: WealthDataPoint[],  // Array de pontos
  summary: {
    currentWealth: number,
    transactionBalance: number,
    investmentValue: number,
    goalsSaved: number,
    cardDebt: number,
    wealthChange: number,         // vs periodo anterior
    wealthChangePercent: number
  },
  period: string
}
```

### `/api/cards/analytics`

Retorna analytics de cartoes de credito.

**Retorno:**
```typescript
{
  spendingByCategory: CardSpendingByCategory[],  // Gastos por categoria (ultimos 6 meses)
  monthlySpending: CardMonthlySpending[],        // 6 meses: 2 anteriores + atual + 3 futuros
  alerts: CardAlert[],                           // Alertas de pagamento, fechamento, uso alto
  summary: {
    totalCards: number,
    totalLimit: number,
    totalUsed: number,
    usagePercentage: number,
    averageMonthlySpending: number,
    totalSpendingLast6Months: number
  }
}
```

**Logica de monthlySpending:**
- Meses passados/atual: soma compras realizadas no mes
- Meses futuros: usa `invoice.total` (inclui parcelas de compras parceladas)

### `/api/auth/verify-password`

Verifica senha do usuario autenticado.

**Request:** `POST { password: string }`
**Response:** `{ valid: boolean }`

Usado para confirmar acoes sensiveis (ex: desativar modo discreto).

## Rate Limiting

O rate limiting é implementado em `src/lib/rate-limit.ts` com presets para diferentes cenários:

| Preset | Limite | Janela | Uso |
|--------|--------|--------|-----|
| `auth` | 5 | 60s | Login, verificar senha |
| `passwordReset` | 3 | 300s | Reset de senha |
| `register` | 3 | 3600s | Registro de usuário |
| `api` | 100 | 60s | GET de dados |
| `mutation` | 30 | 60s | POST/PUT/DELETE |
| `externalApi` | 20 | 60s | APIs externas (cotações) |
| `import` | 5 | 60s | Importação de dados |

## Documentação da API

- **Swagger UI:** `/docs` - Interface interativa da documentação
- **OpenAPI Spec:** `/api/docs` - Spec JSON (OpenAPI 3.0)
- **Arquivo:** `src/lib/openapi.ts` - Definição da spec

## Comandos

```bash
npm run dev           # Dev server
npx tsc --noEmit      # Type check
npx prisma studio     # DB GUI
npx prisma db push    # Sync schema
npx prisma generate   # Generate client
```

---

## Melhorias Futuras

### Criptografia de Dados Sensíveis (Pendente)

**Objetivo:** Armazenar valores financeiros criptografados no banco de dados para maior privacidade.

**Como funciona:**
```
Salvar: valor → encrypt(AES-256) → banco (dado ilegível)
Ler:    banco → decrypt() → valor (exibe normal na aplicação)
```

**Dados a criptografar:**
- `Transaction.value`, `Transaction.description`
- `Investment.quantity`, `Investment.averagePrice`
- `Purchase.value`
- `Budget.limit`
- `FinancialGoal.targetValue`, `currentValue`
- `RecurringExpense.value`
- `Operation.quantity`, `Operation.price`

**Segurança:**
- Algoritmo: **AES-256** (padrão bancário, impossível quebrar sem a chave)
- Chave: `ENCRYPTION_KEY` em variável de ambiente (nunca no código)
- Sem a chave, dados são ilegíveis mesmo com acesso direto ao banco
- Nem IA, nem ferramentas online conseguem reverter

**Implementação necessária:**
1. Criar `lib/encryption.ts` com funções `encrypt()` e `decrypt()`
2. Adicionar `ENCRYPTION_KEY` nas variáveis de ambiente
3. Modificar APIs para criptografar ao salvar e descriptografar ao ler
4. Migrar dados existentes (script de migração)

**Trade-offs:**
- Perde capacidade de fazer cálculos no banco (SUM, AVG, etc.)
- Todos os cálculos precisam ser feitos na aplicação após decrypt
- Aumenta levemente o tempo de resposta das APIs

**Exemplo de uso:**
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(value: number): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(value.toString(), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encrypted: string): number {
  const [ivHex, tagHex, dataHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return parseFloat(decrypted.toString('utf8'));
}
```

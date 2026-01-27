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
  api/                # ~45 API routes (REST)
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
  ui/                 # Base UI (buttons, inputs, collapsible, etc.)
contexts/             # 5 contexts (theme, user, sidebar, preferences, appearance)
hooks/                # use-feedback
lib/                  # 13 utils (auth, prisma, email, pdf, excel, quotes, rates, etc.)
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

## Variaveis de Ambiente

```
DATABASE_URL          # Supabase PostgreSQL
DIRECT_URL            # Direct DB connection
BRAPI_API_KEY         # Cotacoes de acoes
NEXTAUTH_SECRET       # Auth secret
NEXTAUTH_URL          # Auth callback URL
RESEND_API_KEY        # Email service
```

## Comandos

```bash
npm run dev           # Dev server
npx tsc --noEmit      # Type check
npx prisma studio     # DB GUI
npx prisma db push    # Sync schema
npx prisma generate   # Generate client
```

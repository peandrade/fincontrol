# FinControl

Sistema completo de controle financeiro pessoal desenvolvido com Next.js 16, React 19 e Prisma 6.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?style=flat-square&logo=vitest)

## Funcionalidades

### Dashboard
- Resumo financeiro mensal (receitas, despesas, saldo)
- Gráfico de evolução mensal (1 semana a 1 ano)
- Gráfico de despesas por categoria
- Evolução patrimonial consolidada (transações + investimentos + metas - dívidas)
- Score de saúde financeira com métricas detalhadas
- Estatísticas rápidas e calendário financeiro

### Transações
- Registro de receitas e despesas
- Busca por descrição e categoria
- Filtros avançados (período, tipo, categoria, faixa de valor)
- Templates/Atalhos para transações frequentes
- Botões de ação rápida (FAB)
- Importação/Exportação (JSON, CSV, XLSX)

### Investimentos
- **Renda Variável:** Ações, FIIs, ETFs, Criptomoedas
- **Renda Fixa:** CDBs, Tesouro Direto, LCI/LCA, Poupança
- Histórico de operações (compra/venda/depósito/resgate)
- Registro de dividendos recebidos
- Cálculo automático de rentabilidade
- Alocação por tipo de ativo
- Cotações em tempo real via BRAPI

### Cartões de Crédito
- Cadastro de múltiplos cartões
- Controle de faturas mensais
- Registro de compras (à vista e parceladas)
- Acompanhamento de limite disponível
- Analytics de gastos por categoria
- Alertas de vencimento e uso do limite

### Orçamentos
- Definição de limites por categoria
- Acompanhamento de gastos vs. orçamento
- Alertas visuais de consumo
- Orçamentos fixos ou mensais

### Despesas Recorrentes
- Cadastro de contas fixas mensais
- Lançamento automático como transação
- Controle de vencimentos
- Status de pagamento

### Metas Financeiras
- Tipos: Emergência, Viagem, Carro, Casa, Educação, Aposentadoria
- Registro de contribuições
- Acompanhamento de progresso
- Cálculo de valor mensal necessário

### Relatórios e Analytics
- Padrões de gastos por dia da semana
- Tendências de categorias (últimos 6 meses)
- Velocidade de gastos (projeção mensal)
- Comparativo ano atual vs. anterior
- Insights automáticos

### Segurança
- Autenticação com email e senha
- Recuperação de senha por email
- Modo discreto (oculta valores)
- Verificação de senha para ações sensíveis

## Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19, TailwindCSS 4, Radix UI |
| Banco de Dados | PostgreSQL (Supabase) + Prisma 6 |
| Autenticação | NextAuth.js v5 (Auth.js) |
| Estado | Zustand 5 + React Context |
| Gráficos | Recharts 3 |
| Formulários | React Hook Form + Zod 4 |
| Ícones | Lucide React |
| Email | Nodemailer / Resend |
| Testes | Vitest + Testing Library |
| Documentação | OpenAPI 3.0 + Swagger UI |

## Estrutura do Projeto

```
fincontrol/
├── prisma/
│   ├── schema.prisma         # Modelos do banco de dados
│   ├── seed.ts               # Dados de exemplo
│   └── seed-february.ts      # Seed para mês atual
├── src/
│   ├── app/
│   │   ├── (auth)/           # Páginas de autenticação
│   │   ├── api/              # ~46 API Routes
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── transactions/ # Transações
│   │   │   ├── investments/  # Investimentos
│   │   │   ├── cards/        # Cartões
│   │   │   ├── goals/        # Metas
│   │   │   ├── budgets/      # Orçamentos
│   │   │   ├── analytics/    # Analytics avançado
│   │   │   ├── wealth-evolution/
│   │   │   ├── financial-health/
│   │   │   ├── docs/         # OpenAPI spec
│   │   │   └── ...
│   │   ├── docs/             # Swagger UI
│   │   ├── cartoes/          # Página de cartões
│   │   ├── investimentos/    # Página de investimentos
│   │   ├── relatorios/       # Página de relatórios
│   │   ├── conta/            # Configurações do usuário
│   │   ├── layout.tsx        # Layout principal
│   │   └── page.tsx          # Dashboard
│   ├── components/
│   │   ├── auth/             # Formulários de autenticação
│   │   ├── budget/           # Componentes de orçamento
│   │   ├── cards/            # Componentes de cartões
│   │   ├── categories/       # Seleção de categorias
│   │   ├── dashboard/        # Cards, gráficos, listas
│   │   ├── filters/          # Filtros de transações
│   │   ├── forms/            # Modais de formulário
│   │   ├── goals/            # Metas financeiras
│   │   ├── investments/      # Componentes de investimentos
│   │   ├── layout/           # Sidebar, AppShell, Tabs
│   │   ├── providers/        # Context providers
│   │   ├── quick-transaction/# FAB e templates
│   │   ├── recurring/        # Despesas recorrentes
│   │   ├── reports/          # Relatórios e analytics
│   │   └── ui/               # Componentes base
│   ├── contexts/             # React Contexts
│   │   ├── theme-context.tsx
│   │   ├── user-context.tsx
│   │   ├── sidebar-context.tsx
│   │   ├── preferences-context.tsx
│   │   └── appearance-context.tsx
│   ├── hooks/                # Custom hooks
│   │   ├── use-analytics.ts
│   │   ├── use-cards-analytics.ts
│   │   ├── use-dashboard-summary.ts
│   │   ├── use-financial-health.ts
│   │   └── use-wealth-evolution.ts
│   ├── lib/
│   │   ├── auth.ts           # Configuração NextAuth
│   │   ├── prisma.ts         # Cliente Prisma (singleton)
│   │   ├── openapi.ts        # Especificação OpenAPI
│   │   ├── api-utils.ts      # Utilitários de API
│   │   ├── decimal-utils.ts  # Conversão de Decimal
│   │   ├── server-cache.ts   # Cache server-side
│   │   ├── rate-limit.ts     # Rate limiting
│   │   ├── transaction-aggregations.ts
│   │   └── utils.ts          # Utilitários gerais
│   ├── store/                # Zustand stores
│   │   ├── transaction-store.ts
│   │   ├── template-store.ts
│   │   ├── category-store.ts
│   │   ├── card-store.ts
│   │   └── investment-store.ts
│   ├── types/
│   │   └── index.ts          # Tipos TypeScript
│   └── __tests__/            # Testes unitários
│       ├── lib/
│       └── services/
├── public/
├── .env                      # Variáveis de ambiente
├── package.json
├── vitest.config.ts          # Configuração de testes
├── tsconfig.json
└── CLAUDE.md                 # Contexto do projeto
```

## Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou Supabase)
- npm, yarn ou pnpm

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/fincontrol.git
cd fincontrol
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Banco de dados (com connection pooling)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Cotações (BRAPI)
BRAPI_API_KEY="sua-api-key"

# Email (Resend)
RESEND_API_KEY="sua-api-key"
```

4. **Configure o banco de dados**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Aplicar o schema no banco
npx prisma db push

# (Opcional) Popular com dados de exemplo
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Executa o linter (ESLint) |
| `npm test` | Executa testes em modo watch |
| `npm run test:run` | Executa testes uma vez |
| `npm run test:coverage` | Executa testes com cobertura |
| `npm run db:seed` | Popula o banco com dados de exemplo |
| `npm run db:push` | Aplica alterações do schema |
| `npm run db:reset` | Reseta o banco de dados |
| `npm run db:studio` | Abre o Prisma Studio |

## Documentação da API

A API possui documentação interativa completa usando **OpenAPI 3.0** e **Swagger UI**.

### Acesso

- **Documentação Interativa:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI JSON:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Endpoints Principais

#### Transações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/transactions` | Lista transações (com filtros) |
| POST | `/api/transactions` | Cria transação |
| GET | `/api/transactions/[id]` | Obtém transação |
| PATCH | `/api/transactions/[id]` | Atualiza transação |
| DELETE | `/api/transactions/[id]` | Remove transação |

#### Investimentos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/investments` | Lista investimentos |
| POST | `/api/investments` | Cria investimento |
| GET | `/api/investments/[id]` | Obtém investimento |
| PUT | `/api/investments/[id]` | Atualiza investimento |
| DELETE | `/api/investments/[id]` | Remove investimento |
| GET | `/api/investments/[id]/operations` | Lista operações |
| POST | `/api/investments/[id]/operations` | Adiciona operação |
| POST | `/api/investments/quotes` | Atualiza cotações |

#### Cartões
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/cards` | Lista cartões |
| POST | `/api/cards` | Cria cartão |
| GET | `/api/cards/[id]` | Obtém cartão com faturas |
| PUT | `/api/cards/[id]` | Atualiza cartão |
| DELETE | `/api/cards/[id]` | Remove cartão |
| POST | `/api/cards/[id]/purchases` | Adiciona compra |
| GET | `/api/cards/analytics` | Analytics de cartões |

#### Metas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/goals` | Lista metas |
| POST | `/api/goals` | Cria meta |
| PUT | `/api/goals/[id]` | Atualiza meta |
| DELETE | `/api/goals/[id]` | Remove meta |
| POST | `/api/goals/[id]/contribute` | Adiciona contribuição |

#### Analytics
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/analytics` | Analytics avançado |
| GET | `/api/wealth-evolution` | Evolução patrimonial |
| GET | `/api/financial-health` | Score de saúde financeira |
| GET | `/api/dashboard/summary` | Resumo do dashboard |
| GET | `/api/balance` | Saldo atual |

#### Dados
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/data/export` | Exporta dados (JSON/CSV/XLSX) |
| POST | `/api/data/import` | Importa dados (preview) |
| POST | `/api/data/import/confirm` | Confirma importação |
| GET | `/api/data/template` | Baixa template de importação |

## Modelos do Banco de Dados

### Principais Entidades

| Modelo | Descrição |
|--------|-----------|
| **User** | Usuários com settings (general, notification, privacy) |
| **Transaction** | Transações (receitas/despesas) |
| **Category** | Categorias customizáveis + defaults |
| **TransactionTemplate** | Templates para transações rápidas |
| **Investment** | Investimentos (ações, FIIs, CDBs, etc.) |
| **Operation** | Operações de investimento (compra/venda/dividendo) |
| **CreditCard** | Cartões de crédito |
| **Invoice** | Faturas mensais (open, closed, paid, overdue) |
| **Purchase** | Compras no cartão (suporta parcelamento) |
| **Budget** | Orçamentos por categoria (mensal/fixo) |
| **RecurringExpense** | Despesas fixas recorrentes |
| **FinancialGoal** | Metas financeiras |
| **GoalContribution** | Aportes em metas |

## Layout

### Desktop
- Sidebar fixa à esquerda (240px, colapsável para 64px)
- Persistência do estado via localStorage

### Mobile
- Header simplificado
- Bottom tabs com 5 itens: Home, Investimentos, Cartões, Relatórios, Mais

### Temas
- **Dark** (padrão) e **Light**
- Cores primárias: Violet (#8B5CF6) e Indigo (#6366F1)
- CSS variables para customização

## Testes

O projeto usa **Vitest** para testes unitários.

```bash
# Rodar testes em modo watch
npm test

# Rodar testes uma vez
npm run test:run

# Rodar com cobertura
npm run test:coverage
```

### Estrutura de Testes

```
src/__tests__/
├── lib/
│   ├── rate-limit.test.ts
│   ├── fetch-cache.test.ts
│   └── schemas.test.ts
└── services/
    ├── transaction-service.test.ts
    ├── analytics-service.test.ts
    └── investment-operation-service.test.ts
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com Next.js 16 e React 19

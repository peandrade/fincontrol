/**
 * OpenAPI 3.0 Specification for FinControl API
 *
 * This file contains the complete API documentation.
 * Access the interactive documentation at /api/docs
 */

import { API_VERSION } from "./api-version";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FinControl API",
    description: `
API de gestão financeira pessoal do FinControl.

## Autenticação
Todas as rotas (exceto as públicas) requerem autenticação via session cookie.

## Versionamento
- Header \`X-API-Version\` indica a versão atual
- Use \`?api-version=v1\` para especificar versão

## Rate Limiting
- 100 requisições por minuto para rotas padrão
- 10 requisições por minuto para rotas sensíveis (auth)
    `,
    version: API_VERSION,
    contact: {
      name: "FinControl",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  tags: [
    { name: "Auth", description: "Autenticação e gerenciamento de senha" },
    { name: "Transactions", description: "Transações (receitas e despesas)" },
    { name: "Cards", description: "Cartões de crédito" },
    { name: "Investments", description: "Investimentos" },
    { name: "Goals", description: "Metas financeiras" },
    { name: "Budgets", description: "Orçamentos" },
    { name: "Categories", description: "Categorias" },
    { name: "Templates", description: "Templates de transação" },
    { name: "Recurring", description: "Despesas recorrentes" },
    { name: "Dashboard", description: "Dados do dashboard" },
    { name: "Analytics", description: "Análises e relatórios" },
    { name: "User", description: "Perfil e preferências do usuário" },
    { name: "Data", description: "Importação e exportação de dados" },
  ],
  paths: {
    // ==========================================
    // AUTH
    // ==========================================
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar novo usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
            },
          },
        },
        responses: {
          201: { description: "Usuário criado com sucesso" },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { description: "Email já cadastrado" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Solicitar reset de senha",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Email enviado (se existir)" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Redefinir senha com token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Senha alterada" },
          400: { description: "Token inválido ou expirado" },
        },
      },
    },
    "/auth/verify-password": {
      post: {
        tags: ["Auth"],
        summary: "Verificar senha atual",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: {
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado da verificação",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // TRANSACTIONS
    // ==========================================
    "/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "Listar transações",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/MonthParam" },
          { $ref: "#/components/parameters/YearParam" },
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["income", "expense"] },
          },
          {
            name: "categories",
            in: "query",
            schema: { type: "string" },
            description: "Categorias separadas por vírgula",
          },
          {
            name: "all",
            in: "query",
            schema: { type: "boolean" },
            description: "Retornar todas as transações",
          },
        ],
        responses: {
          200: {
            description: "Lista de transações",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transactions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Transaction" },
                    },
                    summary: { $ref: "#/components/schemas/TransactionSummary" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Transactions"],
        summary: "Criar transação",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTransaction" },
            },
          },
        },
        responses: {
          201: {
            description: "Transação criada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transaction" },
              },
            },
          },
          422: { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/transactions/{id}": {
      get: {
        tags: ["Transactions"],
        summary: "Obter transação por ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Transação encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transaction" },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Transactions"],
        summary: "Atualizar transação",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTransaction" },
            },
          },
        },
        responses: {
          200: {
            description: "Transação atualizada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transaction" },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Transactions"],
        summary: "Excluir transação",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Transação excluída" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ==========================================
    // CARDS
    // ==========================================
    "/cards": {
      get: {
        tags: ["Cards"],
        summary: "Listar cartões de crédito",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Lista de cartões",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CreditCard" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Cards"],
        summary: "Criar cartão de crédito",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCreditCard" },
            },
          },
        },
        responses: {
          201: {
            description: "Cartão criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreditCard" },
              },
            },
          },
        },
      },
    },
    "/cards/{id}": {
      get: {
        tags: ["Cards"],
        summary: "Obter cartão por ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Cartão encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreditCardWithInvoices" },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Cards"],
        summary: "Atualizar cartão",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCreditCard" },
            },
          },
        },
        responses: {
          200: { description: "Cartão atualizado" },
        },
      },
      delete: {
        tags: ["Cards"],
        summary: "Excluir cartão",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Cartão excluído" },
        },
      },
    },
    "/cards/{id}/purchases": {
      post: {
        tags: ["Cards"],
        summary: "Adicionar compra ao cartão",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePurchase" },
            },
          },
        },
        responses: {
          201: { description: "Compra adicionada" },
        },
      },
    },
    "/cards/{id}/invoices/{invoiceId}": {
      put: {
        tags: ["Cards"],
        summary: "Atualizar fatura (pagar)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
          {
            name: "invoiceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["paid", "closed"] },
                  paidAmount: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Fatura atualizada" },
        },
      },
    },
    "/cards/analytics": {
      get: {
        tags: ["Cards", "Analytics"],
        summary: "Analytics de cartões",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Dados analíticos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CardAnalytics" },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // INVESTMENTS
    // ==========================================
    "/investments": {
      get: {
        tags: ["Investments"],
        summary: "Listar investimentos",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Lista de investimentos com resumo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    investments: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Investment" },
                    },
                    summary: { $ref: "#/components/schemas/InvestmentSummary" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Investments"],
        summary: "Criar investimento",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateInvestment" },
            },
          },
        },
        responses: {
          201: { description: "Investimento criado" },
        },
      },
    },
    "/investments/{id}": {
      get: {
        tags: ["Investments"],
        summary: "Obter investimento por ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Investimento com operações",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InvestmentWithOperations" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Investments"],
        summary: "Atualizar investimento",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateInvestment" },
            },
          },
        },
        responses: {
          200: { description: "Investimento atualizado" },
        },
      },
      delete: {
        tags: ["Investments"],
        summary: "Excluir investimento",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Investimento excluído" },
        },
      },
    },
    "/investments/{id}/operations": {
      get: {
        tags: ["Investments"],
        summary: "Listar operações do investimento",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Lista de operações",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Operation" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Investments"],
        summary: "Adicionar operação",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOperation" },
            },
          },
        },
        responses: {
          201: { description: "Operação adicionada" },
        },
      },
    },
    "/investments/quotes": {
      post: {
        tags: ["Investments"],
        summary: "Atualizar cotações",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Cotações atualizadas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    updated: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/investments/analytics": {
      get: {
        tags: ["Investments", "Analytics"],
        summary: "Analytics de investimentos",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Dados analíticos de investimentos" },
        },
      },
    },

    // ==========================================
    // GOALS
    // ==========================================
    "/goals": {
      get: {
        tags: ["Goals"],
        summary: "Listar metas financeiras",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Lista de metas com progresso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    goals: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Goal" },
                    },
                    summary: { $ref: "#/components/schemas/GoalSummary" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Goals"],
        summary: "Criar meta",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateGoal" },
            },
          },
        },
        responses: {
          201: { description: "Meta criada" },
        },
      },
    },
    "/goals/{id}": {
      get: {
        tags: ["Goals"],
        summary: "Obter meta por ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Meta com contribuições",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoalWithContributions" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Goals"],
        summary: "Atualizar meta",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateGoal" },
            },
          },
        },
        responses: {
          200: { description: "Meta atualizada" },
        },
      },
      delete: {
        tags: ["Goals"],
        summary: "Excluir meta",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Meta excluída" },
        },
      },
    },
    "/goals/{id}/contribute": {
      post: {
        tags: ["Goals"],
        summary: "Adicionar contribuição à meta",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateContribution" },
            },
          },
        },
        responses: {
          200: {
            description: "Contribuição adicionada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    contribution: { $ref: "#/components/schemas/Contribution" },
                    newCurrentValue: { type: "number" },
                    isCompleted: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Goals"],
        summary: "Remover contribuição",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contributionId"],
                properties: {
                  contributionId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Contribuição removida" },
        },
      },
    },

    // ==========================================
    // BUDGETS
    // ==========================================
    "/budgets": {
      get: {
        tags: ["Budgets"],
        summary: "Listar orçamentos",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/MonthParam" },
          { $ref: "#/components/parameters/YearParam" },
        ],
        responses: {
          200: {
            description: "Orçamentos com gastos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    budgets: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Budget" },
                    },
                    summary: { $ref: "#/components/schemas/BudgetSummary" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Budgets"],
        summary: "Criar orçamento",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBudget" },
            },
          },
        },
        responses: {
          201: { description: "Orçamento criado" },
        },
      },
    },
    "/budgets/{id}": {
      put: {
        tags: ["Budgets"],
        summary: "Atualizar orçamento",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBudget" },
            },
          },
        },
        responses: {
          200: { description: "Orçamento atualizado" },
        },
      },
      delete: {
        tags: ["Budgets"],
        summary: "Excluir orçamento",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Orçamento excluído" },
        },
      },
    },

    // ==========================================
    // CATEGORIES
    // ==========================================
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "Listar categorias",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Categorias padrão e customizadas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Category" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Criar categoria",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCategory" },
            },
          },
        },
        responses: {
          201: { description: "Categoria criada" },
        },
      },
    },
    "/categories/{id}": {
      put: {
        tags: ["Categories"],
        summary: "Atualizar categoria",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCategory" },
            },
          },
        },
        responses: {
          200: { description: "Categoria atualizada" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Excluir categoria",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Categoria excluída" },
          400: { description: "Categoria em uso" },
        },
      },
    },

    // ==========================================
    // TEMPLATES
    // ==========================================
    "/templates": {
      get: {
        tags: ["Templates"],
        summary: "Listar templates de transação",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Lista de templates",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Template" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Templates"],
        summary: "Criar template",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTemplate" },
            },
          },
        },
        responses: {
          201: { description: "Template criado" },
        },
      },
    },
    "/templates/{id}": {
      get: {
        tags: ["Templates"],
        summary: "Obter template por ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Template encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Template" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Templates"],
        summary: "Atualizar template",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: { description: "Template atualizado" },
        },
      },
      post: {
        tags: ["Templates"],
        summary: "Incrementar uso do template",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: { description: "Contador incrementado" },
        },
      },
      delete: {
        tags: ["Templates"],
        summary: "Excluir template",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Template excluído" },
        },
      },
    },

    // ==========================================
    // RECURRING EXPENSES
    // ==========================================
    "/recurring-expenses": {
      get: {
        tags: ["Recurring"],
        summary: "Listar despesas recorrentes",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Despesas recorrentes com status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    expenses: {
                      type: "array",
                      items: { $ref: "#/components/schemas/RecurringExpense" },
                    },
                    summary: { $ref: "#/components/schemas/RecurringSummary" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Recurring"],
        summary: "Criar despesa recorrente",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRecurringExpense" },
            },
          },
        },
        responses: {
          201: { description: "Despesa criada" },
        },
      },
    },
    "/recurring-expenses/{id}": {
      put: {
        tags: ["Recurring"],
        summary: "Atualizar despesa recorrente",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: { description: "Despesa atualizada" },
        },
      },
      delete: {
        tags: ["Recurring"],
        summary: "Excluir despesa recorrente",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Despesa excluída" },
        },
      },
    },
    "/recurring-expenses/launch": {
      post: {
        tags: ["Recurring"],
        summary: "Lançar despesas do mês",
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  expenseIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "IDs específicos (opcional)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Despesas lançadas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    launched: { type: "number" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // DASHBOARD & ANALYTICS
    // ==========================================
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Resumo do dashboard",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/MonthParam" },
          { $ref: "#/components/parameters/YearParam" },
        ],
        responses: {
          200: {
            description: "Dados do dashboard",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardSummary" },
              },
            },
          },
        },
      },
    },
    "/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Dados de evolução financeira",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "period",
            in: "query",
            schema: { type: "string", enum: ["1w", "1m", "3m", "6m", "1y"] },
          },
        ],
        responses: {
          200: { description: "Dados de evolução" },
        },
      },
    },
    "/wealth-evolution": {
      get: {
        tags: ["Analytics"],
        summary: "Evolução patrimonial",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "period",
            in: "query",
            schema: { type: "string", enum: ["1w", "1m", "3m", "6m", "1y"] },
          },
        ],
        responses: {
          200: {
            description: "Evolução do patrimônio",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WealthEvolution" },
              },
            },
          },
        },
      },
    },
    "/financial-health": {
      get: {
        tags: ["Analytics"],
        summary: "Score de saúde financeira",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Score e métricas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FinancialHealth" },
              },
            },
          },
        },
      },
    },
    "/balance": {
      get: {
        tags: ["Analytics"],
        summary: "Saldo atual",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Saldo calculado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    balance: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/budget-alerts": {
      get: {
        tags: ["Analytics"],
        summary: "Alertas de orçamento",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Lista de alertas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/BudgetAlert" },
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // USER
    // ==========================================
    "/user/profile": {
      get: {
        tags: ["User"],
        summary: "Obter perfil do usuário",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Perfil do usuário",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
        },
      },
      put: {
        tags: ["User"],
        summary: "Atualizar perfil",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfile" },
            },
          },
        },
        responses: {
          200: { description: "Perfil atualizado" },
        },
      },
    },
    "/user/preferences": {
      get: {
        tags: ["User"],
        summary: "Obter preferências",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Preferências do usuário",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserPreferences" },
              },
            },
          },
        },
      },
      put: {
        tags: ["User"],
        summary: "Atualizar preferências",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserPreferences" },
            },
          },
        },
        responses: {
          200: { description: "Preferências atualizadas" },
        },
      },
    },
    "/user/change-password": {
      post: {
        tags: ["User"],
        summary: "Alterar senha",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Senha alterada" },
          400: { description: "Senha atual incorreta" },
        },
      },
    },

    // ==========================================
    // DATA IMPORT/EXPORT
    // ==========================================
    "/data/export": {
      get: {
        tags: ["Data"],
        summary: "Exportar dados",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["json", "csv", "xlsx"] },
          },
        ],
        responses: {
          200: { description: "Arquivo de exportação" },
        },
      },
    },
    "/data/import": {
      post: {
        tags: ["Data"],
        summary: "Importar dados (preview)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Preview da importação" },
        },
      },
    },
    "/data/import/confirm": {
      post: {
        tags: ["Data"],
        summary: "Confirmar importação",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transactions"],
                properties: {
                  transactions: { type: "array" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Dados importados" },
        },
      },
    },
    "/data/template": {
      get: {
        tags: ["Data"],
        summary: "Baixar template de importação",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Arquivo de template" },
        },
      },
    },

    // ==========================================
    // MISC
    // ==========================================
    "/rates": {
      get: {
        tags: ["Analytics"],
        summary: "Taxas e cotações",
        description: "Rota pública",
        responses: {
          200: {
            description: "Taxas atuais",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    selic: { type: "number" },
                    cdi: { type: "number" },
                    ipca: { type: "number" },
                    dollar: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/purchases/{id}": {
      delete: {
        tags: ["Cards"],
        summary: "Excluir compra",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          204: { description: "Compra excluída" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "Session cookie (NextAuth)",
      },
    },
    parameters: {
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "ID do recurso",
      },
      MonthParam: {
        name: "month",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 12 },
        description: "Mês (1-12)",
      },
      YearParam: {
        name: "year",
        in: "query",
        schema: { type: "integer" },
        description: "Ano",
      },
    },
    responses: {
      Unauthorized: {
        description: "Não autorizado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Recurso não encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      BadRequest: {
        description: "Requisição inválida",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      ValidationError: {
        description: "Erro de validação",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationError" },
          },
        },
      },
    },
    schemas: {
      // Error Schemas
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string", enum: ["VALIDATION_ERROR"] },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },

      // Auth Schemas
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },

      // Transaction Schemas
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          value: { type: "number" },
          category: { type: "string" },
          description: { type: "string" },
          date: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateTransaction: {
        type: "object",
        required: ["type", "value", "category", "date"],
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          value: { type: "number", minimum: 0.01 },
          category: { type: "string" },
          description: { type: "string" },
          date: { type: "string", format: "date" },
        },
      },
      UpdateTransaction: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          value: { type: "number", minimum: 0.01 },
          category: { type: "string" },
          description: { type: "string" },
          date: { type: "string", format: "date" },
        },
      },
      TransactionSummary: {
        type: "object",
        properties: {
          totalIncome: { type: "number" },
          totalExpense: { type: "number" },
          balance: { type: "number" },
        },
      },

      // Credit Card Schemas
      CreditCard: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          lastDigits: { type: "string" },
          brand: { type: "string" },
          limit: { type: "number" },
          closingDay: { type: "integer" },
          dueDay: { type: "integer" },
          color: { type: "string" },
          currentInvoice: { $ref: "#/components/schemas/Invoice" },
        },
      },
      CreditCardWithInvoices: {
        allOf: [
          { $ref: "#/components/schemas/CreditCard" },
          {
            type: "object",
            properties: {
              invoices: {
                type: "array",
                items: { $ref: "#/components/schemas/Invoice" },
              },
            },
          },
        ],
      },
      CreateCreditCard: {
        type: "object",
        required: ["name", "lastDigits", "brand", "limit", "closingDay", "dueDay"],
        properties: {
          name: { type: "string" },
          lastDigits: { type: "string", minLength: 4, maxLength: 4 },
          brand: { type: "string" },
          limit: { type: "number", minimum: 0 },
          closingDay: { type: "integer", minimum: 1, maximum: 31 },
          dueDay: { type: "integer", minimum: 1, maximum: 31 },
          color: { type: "string" },
        },
      },
      UpdateCreditCard: {
        type: "object",
        properties: {
          name: { type: "string" },
          limit: { type: "number" },
          closingDay: { type: "integer" },
          dueDay: { type: "integer" },
          color: { type: "string" },
        },
      },
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string" },
          month: { type: "integer" },
          year: { type: "integer" },
          total: { type: "number" },
          paidAmount: { type: "number" },
          status: { type: "string", enum: ["open", "closed", "paid", "overdue"] },
          dueDate: { type: "string", format: "date" },
        },
      },
      CreatePurchase: {
        type: "object",
        required: ["description", "value", "category", "date"],
        properties: {
          description: { type: "string" },
          value: { type: "number", minimum: 0.01 },
          category: { type: "string" },
          date: { type: "string", format: "date" },
          installments: { type: "integer", minimum: 1, maximum: 48, default: 1 },
        },
      },
      CardAnalytics: {
        type: "object",
        properties: {
          spendingByCategory: { type: "array" },
          monthlySpending: { type: "array" },
          alerts: { type: "array" },
          summary: { type: "object" },
        },
      },

      // Investment Schemas
      Investment: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          ticker: { type: "string", nullable: true },
          type: {
            type: "string",
            enum: ["stock", "fii", "etf", "crypto", "cdb", "lci", "lca", "tesouro", "poupanca"],
          },
          quantity: { type: "number" },
          averagePrice: { type: "number" },
          currentPrice: { type: "number" },
          totalInvested: { type: "number" },
          currentValue: { type: "number" },
          profitLoss: { type: "number" },
          profitLossPercent: { type: "number" },
        },
      },
      InvestmentWithOperations: {
        allOf: [
          { $ref: "#/components/schemas/Investment" },
          {
            type: "object",
            properties: {
              operations: {
                type: "array",
                items: { $ref: "#/components/schemas/Operation" },
              },
            },
          },
        ],
      },
      CreateInvestment: {
        type: "object",
        required: ["name", "type"],
        properties: {
          name: { type: "string" },
          ticker: { type: "string" },
          type: { type: "string" },
          broker: { type: "string" },
          indexer: { type: "string" },
          interestRate: { type: "number" },
          maturityDate: { type: "string", format: "date" },
        },
      },
      UpdateInvestment: {
        type: "object",
        properties: {
          name: { type: "string" },
          broker: { type: "string" },
        },
      },
      Operation: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["buy", "sell", "dividend"] },
          quantity: { type: "number" },
          price: { type: "number" },
          total: { type: "number" },
          date: { type: "string", format: "date-time" },
          fees: { type: "number" },
          notes: { type: "string", nullable: true },
        },
      },
      CreateOperation: {
        type: "object",
        required: ["type", "date"],
        properties: {
          type: { type: "string", enum: ["buy", "sell", "dividend"] },
          quantity: { type: "number" },
          price: { type: "number" },
          total: { type: "number" },
          date: { type: "string", format: "date" },
          fees: { type: "number" },
          notes: { type: "string" },
        },
      },
      InvestmentSummary: {
        type: "object",
        properties: {
          totalInvested: { type: "number" },
          currentValue: { type: "number" },
          profitLoss: { type: "number" },
          profitLossPercent: { type: "number" },
          totalAssets: { type: "integer" },
        },
      },

      // Goal Schemas
      Goal: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          category: {
            type: "string",
            enum: ["emergency", "travel", "car", "house", "education", "retirement", "other"],
          },
          targetValue: { type: "number" },
          currentValue: { type: "number" },
          targetDate: { type: "string", format: "date", nullable: true },
          progress: { type: "number" },
          remaining: { type: "number" },
          monthlyNeeded: { type: "number", nullable: true },
          isCompleted: { type: "boolean" },
          color: { type: "string" },
          icon: { type: "string", nullable: true },
        },
      },
      GoalWithContributions: {
        allOf: [
          { $ref: "#/components/schemas/Goal" },
          {
            type: "object",
            properties: {
              contributions: {
                type: "array",
                items: { $ref: "#/components/schemas/Contribution" },
              },
            },
          },
        ],
      },
      CreateGoal: {
        type: "object",
        required: ["name", "type", "targetValue"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          type: { type: "string" },
          targetValue: { type: "number", minimum: 0.01 },
          currentValue: { type: "number" },
          deadline: { type: "string", format: "date" },
          icon: { type: "string" },
          color: { type: "string" },
        },
      },
      UpdateGoal: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          type: { type: "string" },
          targetValue: { type: "number" },
          deadline: { type: "string", format: "date" },
          icon: { type: "string" },
          color: { type: "string" },
        },
      },
      Contribution: {
        type: "object",
        properties: {
          id: { type: "string" },
          value: { type: "number" },
          date: { type: "string", format: "date-time" },
          notes: { type: "string", nullable: true },
        },
      },
      CreateContribution: {
        type: "object",
        required: ["value"],
        properties: {
          value: { type: "number", minimum: 0.01 },
          date: { type: "string", format: "date" },
          notes: { type: "string" },
        },
      },
      GoalSummary: {
        type: "object",
        properties: {
          totalGoals: { type: "integer" },
          completedGoals: { type: "integer" },
          totalTargetValue: { type: "number" },
          totalCurrentValue: { type: "number" },
          overallProgress: { type: "number" },
        },
      },

      // Budget Schemas
      Budget: {
        type: "object",
        properties: {
          id: { type: "string" },
          category: { type: "string" },
          limit: { type: "number" },
          month: { type: "integer" },
          year: { type: "integer" },
          spent: { type: "number" },
          percentage: { type: "number" },
          remaining: { type: "number" },
        },
      },
      CreateBudget: {
        type: "object",
        required: ["category", "limit"],
        properties: {
          category: { type: "string" },
          limit: { type: "number", minimum: 0.01 },
          month: { type: "integer" },
          year: { type: "integer" },
          isFixed: { type: "boolean" },
        },
      },
      UpdateBudget: {
        type: "object",
        properties: {
          category: { type: "string" },
          limit: { type: "number" },
          period: { type: "string" },
        },
      },
      BudgetSummary: {
        type: "object",
        properties: {
          totalLimit: { type: "number" },
          totalSpent: { type: "number" },
          totalRemaining: { type: "number" },
          totalPercentage: { type: "number" },
        },
      },
      BudgetAlert: {
        type: "object",
        properties: {
          category: { type: "string" },
          limit: { type: "number" },
          spent: { type: "number" },
          percentage: { type: "number" },
          status: { type: "string", enum: ["warning", "danger", "exceeded"] },
        },
      },

      // Category Schema
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          icon: { type: "string" },
          color: { type: "string" },
          isDefault: { type: "boolean" },
        },
      },
      CreateCategory: {
        type: "object",
        required: ["name", "type"],
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          icon: { type: "string" },
          color: { type: "string" },
        },
      },
      UpdateCategory: {
        type: "object",
        properties: {
          name: { type: "string" },
          icon: { type: "string" },
          color: { type: "string" },
        },
      },

      // Template Schema
      Template: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          description: { type: "string", nullable: true },
          value: { type: "number", nullable: true },
          usageCount: { type: "integer" },
        },
      },
      CreateTemplate: {
        type: "object",
        required: ["name", "type", "category"],
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          description: { type: "string" },
          value: { type: "number" },
        },
      },

      // Recurring Expense Schema
      RecurringExpense: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          value: { type: "number" },
          category: { type: "string" },
          dueDay: { type: "integer" },
          isActive: { type: "boolean" },
          isLaunchedThisMonth: { type: "boolean" },
          isPastDue: { type: "boolean" },
        },
      },
      CreateRecurringExpense: {
        type: "object",
        required: ["name", "value", "category", "dueDay"],
        properties: {
          name: { type: "string" },
          value: { type: "number", minimum: 0.01 },
          category: { type: "string" },
          dueDay: { type: "integer", minimum: 1, maximum: 31 },
          description: { type: "string" },
        },
      },
      RecurringSummary: {
        type: "object",
        properties: {
          totalMonthly: { type: "number" },
          totalLaunched: { type: "number" },
          totalPending: { type: "number" },
          launchedCount: { type: "integer" },
          pendingCount: { type: "integer" },
        },
      },

      // Dashboard Schemas
      DashboardSummary: {
        type: "object",
        properties: {
          income: { type: "number" },
          expense: { type: "number" },
          balance: { type: "number" },
          investmentValue: { type: "number" },
          goalsProgress: { type: "number" },
          upcomingBills: { type: "integer" },
        },
      },
      WealthEvolution: {
        type: "object",
        properties: {
          evolution: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                transactionBalance: { type: "number" },
                investmentValue: { type: "number" },
                goalsSaved: { type: "number" },
                cardDebt: { type: "number" },
                totalWealth: { type: "number" },
              },
            },
          },
          summary: {
            type: "object",
            properties: {
              currentWealth: { type: "number" },
              wealthChange: { type: "number" },
              wealthChangePercent: { type: "number" },
            },
          },
        },
      },
      FinancialHealth: {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          grade: { type: "string", enum: ["A", "B", "C", "D", "F"] },
          metrics: {
            type: "object",
            properties: {
              savingsRate: { type: "number" },
              debtRatio: { type: "number" },
              emergencyFund: { type: "number" },
              budgetAdherence: { type: "number" },
            },
          },
        },
      },

      // User Schemas
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          image: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UpdateProfile: {
        type: "object",
        properties: {
          name: { type: "string" },
          image: { type: "string" },
        },
      },
      UserPreferences: {
        type: "object",
        properties: {
          general: {
            type: "object",
            properties: {
              defaultPage: { type: "string" },
              defaultPeriod: { type: "string" },
              defaultSort: { type: "string" },
              confirmBeforeDelete: { type: "boolean" },
            },
          },
          notification: {
            type: "object",
            properties: {
              budgetAlerts: { type: "boolean" },
              billReminders: { type: "boolean" },
              weeklyReports: { type: "boolean" },
            },
          },
          privacy: {
            type: "object",
            properties: {
              hideValues: { type: "boolean" },
              autoLock: { type: "boolean" },
            },
          },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;

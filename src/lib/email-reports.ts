interface WeeklyReportData {
  userName?: string;
  weekStart: string;
  weekEnd: string;
  income: number;
  expenses: number;
  balance: number;
  currentBalance: number;
  topCategories: { name: string; total: number; percentage: number }[];
  budgets: { category: string; spent: number; limit: number; percentage: number }[];
}

interface MonthlyReportData {
  userName?: string;
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  currentBalance: number;
  previousIncome: number;
  previousExpenses: number;
  topCategories: { name: string; total: number; percentage: number }[];
  budgets: { category: string; spent: number; limit: number; percentage: number }[];
  goals: { name: string; current: number; target: number; percentage: number }[];
  investments: { totalInvested: number; currentValue: number; profitLoss: number; profitLossPercent: number };
  cardInvoices: { cardName: string; total: number; dueDate: string }[];
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getProgressBarColor(percentage: number): string {
  if (percentage >= 100) return "#EF4444";
  if (percentage >= 80) return "#F59E0B";
  return "#10B981";
}

function getChangeIndicator(current: number, previous: number): { text: string; color: string } {
  if (previous === 0) return { text: "N/A", color: "#71717a" };
  const change = ((current - previous) / previous) * 100;
  if (change > 0) return { text: `+${change.toFixed(1)}%`, color: "#10B981" };
  if (change < 0) return { text: `${change.toFixed(1)}%`, color: "#EF4444" };
  return { text: "0%", color: "#71717a" };
}

function emailHeader(): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #09090b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: linear-gradient(180deg, #18181b 0%, #0f0f12 100%); border-radius: 24px; border: 1px solid #27272a; overflow: hidden;">`;
}

function emailBranding(title: string, subtitle: string): string {
  return `
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6366f1 100%); padding: 40px 40px 50px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: rgba(255,255,255,0.2); border-radius: 16px; padding: 12px 20px;">
                    <span style="font-size: 32px; font-weight: 700; color: #ffffff;">$</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 20px 0 0 0; letter-spacing: -0.5px;">
                CifraCash
              </h1>
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0 0;">
                ${title}
              </p>
              <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0 0 0;">
                ${subtitle}
              </p>
            </td>
          </tr>`;
}

function emailFooter(): string {
  const currentYear = new Date().getFullYear();
  return `
          <tr>
            <td style="background-color: #0f0f12; padding: 24px 40px; border-top: 1px solid #27272a;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #52525b; font-size: 12px; margin: 0 0 8px 0;">
                      Este é um email automático do CifraCash.
                    </p>
                    <p style="color: #3f3f46; font-size: 11px; margin: 0;">
                      © ${currentYear} CifraCash. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function statCard(label: string, value: string, color: string): string {
  return `
    <td style="padding: 4px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: rgba(39, 39, 42, 0.5); border-radius: 12px;">
        <tr>
          <td style="padding: 16px; text-align: center;">
            <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">${label}</p>
            <p style="color: ${color}; font-size: 18px; font-weight: 700; margin: 0;">${value}</p>
          </td>
        </tr>
      </table>
    </td>`;
}

function budgetRow(budget: { category: string; spent: number; limit: number; percentage: number }): string {
  const barColor = getProgressBarColor(budget.percentage);
  const clampedPercent = Math.min(budget.percentage, 100);
  return `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
          <tr>
            <td style="color: #fafafa; font-size: 13px;">${budget.category}</td>
            <td style="color: #a1a1aa; font-size: 12px; text-align: right;">${formatBRL(budget.spent)} / ${formatBRL(budget.limit)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 4px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #27272a; border-radius: 4px; height: 6px;">
                <tr>
                  <td style="width: ${clampedPercent}%; background-color: ${barColor}; border-radius: 4px; height: 6px;"></td>
                  <td style="height: 6px;"></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function sectionTitle(icon: string, title: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0 12px 0;">
      <tr>
        <td>
          <p style="color: #a1a1aa; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
            ${icon} ${title}
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: 8px;">
            <tr><td style="border-top: 1px solid #27272a;"></td></tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  const netBalance = data.income - data.expenses;
  const netColor = netBalance >= 0 ? "#10B981" : "#EF4444";

  const topCategoriesHtml = data.topCategories.length > 0
    ? data.topCategories.map((cat) => `
        <tr>
          <td style="padding: 6px 0; color: #fafafa; font-size: 13px;">${cat.name}</td>
          <td style="padding: 6px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${formatBRL(cat.total)}</td>
          <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-align: right; width: 50px;">${cat.percentage.toFixed(0)}%</td>
        </tr>
      `).join("")
    : `<tr><td style="padding: 12px 0; color: #71717a; font-size: 13px; text-align: center;">Nenhuma despesa registrada</td></tr>`;

  const budgetsHtml = data.budgets.length > 0
    ? data.budgets.map(budgetRow).join("")
    : "";

  return `${emailHeader()}
${emailBranding("Resumo Semanal", `${data.weekStart} — ${data.weekEnd}`)}
          <tr>
            <td style="padding: 40px;">
              <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
                ${data.userName ? `Olá <span style="color: #fafafa; font-weight: 500;">${data.userName}</span>,` : "Olá,"}
                <br>Aqui está o resumo da sua semana financeira.
              </p>

              ${sectionTitle("📊", "Resumo da Semana")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  ${statCard("Receitas", formatBRL(data.income), "#10B981")}
                  ${statCard("Despesas", formatBRL(data.expenses), "#EF4444")}
                </tr>
                <tr>
                  ${statCard("Saldo Semanal", formatBRL(netBalance), netColor)}
                  ${statCard("Saldo Atual", formatBRL(data.currentBalance), "#8B5CF6")}
                </tr>
              </table>

              ${data.topCategories.length > 0 ? `
              ${sectionTitle("📂", "Top Categorias de Gastos")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: rgba(39, 39, 42, 0.3); border-radius: 12px; padding: 4px;">
                ${topCategoriesHtml}
              </table>
              ` : ""}

              ${data.budgets.length > 0 ? `
              ${sectionTitle("💼", "Status dos Orçamentos")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                ${budgetsHtml}
              </table>
              ` : ""}
            </td>
          </tr>
${emailFooter()}`;
}

export function generateMonthlyReportEmail(data: MonthlyReportData): string {
  const netBalance = data.income - data.expenses;
  const netColor = netBalance >= 0 ? "#10B981" : "#EF4444";
  const incomeChange = getChangeIndicator(data.income, data.previousIncome);
  const expenseChange = getChangeIndicator(data.expenses, data.previousExpenses);

  const topCategoriesHtml = data.topCategories.length > 0
    ? data.topCategories.map((cat) => `
        <tr>
          <td style="padding: 6px 0; color: #fafafa; font-size: 13px;">${cat.name}</td>
          <td style="padding: 6px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${formatBRL(cat.total)}</td>
          <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-align: right; width: 50px;">${cat.percentage.toFixed(0)}%</td>
        </tr>
      `).join("")
    : "";

  const budgetsHtml = data.budgets.length > 0
    ? data.budgets.map(budgetRow).join("")
    : "";

  const goalsHtml = data.goals.length > 0
    ? data.goals.map((goal) => {
        const barColor = goal.percentage >= 100 ? "#10B981" : "#8B5CF6";
        const clampedPercent = Math.min(goal.percentage, 100);
        return `
          <tr>
            <td style="padding: 8px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  <td style="color: #fafafa; font-size: 13px;">${goal.name}</td>
                  <td style="color: ${goal.percentage >= 100 ? "#10B981" : "#a1a1aa"}; font-size: 12px; text-align: right; font-weight: 600;">${goal.percentage.toFixed(0)}%</td>
                </tr>
                <tr>
                  <td style="color: #71717a; font-size: 11px; padding-top: 2px;">${formatBRL(goal.current)} / ${formatBRL(goal.target)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 4px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #27272a; border-radius: 4px; height: 6px;">
                      <tr>
                        <td style="width: ${clampedPercent}%; background-color: ${barColor}; border-radius: 4px; height: 6px;"></td>
                        <td style="height: 6px;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      }).join("")
    : "";

  const invoicesHtml = data.cardInvoices.length > 0
    ? data.cardInvoices.map((inv) => `
        <tr>
          <td style="padding: 6px 0; color: #fafafa; font-size: 13px;">${inv.cardName}</td>
          <td style="padding: 6px 0; color: #EF4444; font-size: 13px; text-align: right; font-weight: 600;">${formatBRL(inv.total)}</td>
          <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-align: right;">${inv.dueDate}</td>
        </tr>
      `).join("")
    : "";

  const investProfitColor = data.investments.profitLoss >= 0 ? "#10B981" : "#EF4444";

  return `${emailHeader()}
${emailBranding("Resumo Mensal", `${data.month} de ${data.year}`)}
          <tr>
            <td style="padding: 40px;">
              <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
                ${data.userName ? `Olá <span style="color: #fafafa; font-weight: 500;">${data.userName}</span>,` : "Olá,"}
                <br>Aqui está o resumo completo do seu mês.
              </p>

              ${sectionTitle("📊", "Receitas e Despesas")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  ${statCard(`Receitas <span style="color:${incomeChange.color};font-size:10px;">${incomeChange.text}</span>`, formatBRL(data.income), "#10B981")}
                  ${statCard(`Despesas <span style="color:${expenseChange.color};font-size:10px;">${expenseChange.text}</span>`, formatBRL(data.expenses), "#EF4444")}
                </tr>
                <tr>
                  ${statCard("Saldo do Mês", formatBRL(netBalance), netColor)}
                  ${statCard("Saldo Geral", formatBRL(data.currentBalance), "#8B5CF6")}
                </tr>
              </table>

              ${data.topCategories.length > 0 ? `
              ${sectionTitle("📂", "Top Categorias")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                ${topCategoriesHtml}
              </table>
              ` : ""}

              ${data.budgets.length > 0 ? `
              ${sectionTitle("💼", "Orçamentos")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                ${budgetsHtml}
              </table>
              ` : ""}

              ${data.goals.length > 0 ? `
              ${sectionTitle("🎯", "Metas")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                ${goalsHtml}
              </table>
              ` : ""}

              ${data.investments.totalInvested > 0 ? `
              ${sectionTitle("📈", "Investimentos")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  ${statCard("Investido", formatBRL(data.investments.totalInvested), "#a1a1aa")}
                  ${statCard("Valor Atual", formatBRL(data.investments.currentValue), "#8B5CF6")}
                </tr>
                <tr>
                  ${statCard("Lucro/Prejuízo", formatBRL(data.investments.profitLoss), investProfitColor)}
                  ${statCard("Rendimento", `${data.investments.profitLossPercent.toFixed(1)}%`, investProfitColor)}
                </tr>
              </table>
              ` : ""}

              ${data.cardInvoices.length > 0 ? `
              ${sectionTitle("💳", "Faturas de Cartão")}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: rgba(39, 39, 42, 0.3); border-radius: 12px;">
                ${invoicesHtml}
              </table>
              ` : ""}
            </td>
          </tr>
${emailFooter()}`;
}

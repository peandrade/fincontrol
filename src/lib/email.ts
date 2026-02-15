import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {

  if (!process.env.RESEND_API_KEY) {
    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║            📧 EMAIL (dev mode - Resend não configurado)       ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log(`║ Para: ${to.padEnd(54)}║`);
    console.log(`║ Assunto: ${subject.padEnd(51)}║`);
    console.log("╠══════════════════════════════════════════════════════════════╣");

    const linkMatch = html.match(/href="([^"]*reset-password[^"]*)"/);
    if (linkMatch) {
      console.log("║ 🔗 Link de recuperação:                                       ║");
      console.log(`║ ${linkMatch[1].substring(0, 60).padEnd(62)}║`);
      if (linkMatch[1].length > 60) {
        console.log(`║ ${linkMatch[1].substring(60).padEnd(62)}║`);
      }
    }
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("\n");
    return { success: true, dev: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "CifraCash <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Erro ao enviar email via Resend:", error);
      throw new Error(error.message);
    }

    console.log("Email enviado com sucesso:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error;
  }
}

export function generatePasswordResetEmail(resetUrl: string, userName?: string) {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Recuperação de Senha - CifraCash</title>
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

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Container Principal -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background: linear-gradient(180deg, #18181b 0%, #0f0f12 100%); border-radius: 24px; border: 1px solid #27272a; overflow: hidden;">

          <!-- Header com gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6366f1 100%); padding: 40px 40px 50px 40px; text-align: center;">

              <!-- Logo -->
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
                Suas finanças sob controle
              </p>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">

              <!-- Ícone de cadeado -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%); border-radius: 50%; padding: 16px; border: 1px solid rgba(124, 58, 237, 0.3);">
                    <img src="https://img.icons8.com/fluency/48/lock-2.png" alt="Lock" width="32" height="32" style="display: block;">
                  </td>
                </tr>
              </table>

              <!-- Título -->
              <h2 style="color: #fafafa; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">
                Redefinição de Senha
              </h2>

              <!-- Saudação -->
              <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
                ${userName ? `Olá <span style="color: #fafafa; font-weight: 500;">${userName}</span>,` : "Olá,"}
                <br><br>
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Clique no botão abaixo para criar uma nova senha segura.
              </p>

              <!-- Botão -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px;">
                      🔐 Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de expiração -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 32px 0; background-color: rgba(251, 191, 36, 0.1); border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.2);">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: top; padding-right: 12px;">
                          <span style="font-size: 20px;">⏱️</span>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="color: #fbbf24; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">
                            Link válido por 1 hora
                          </p>
                          <p style="color: #a1a1aa; font-size: 12px; margin: 0; line-height: 1.5;">
                            Por segurança, este link expira em 60 minutos. Após esse período, solicite um novo link.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0;">
                <tr>
                  <td style="border-top: 1px solid #27272a;"></td>
                </tr>
              </table>

              <!-- Não solicitou? -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: rgba(39, 39, 42, 0.5); border-radius: 12px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: top; padding-right: 12px;">
                          <span style="font-size: 20px;">🛡️</span>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="color: #71717a; font-size: 13px; margin: 0; line-height: 1.6;">
                            <strong style="color: #a1a1aa;">Não solicitou esta alteração?</strong><br>
                            Ignore este email e sua senha permanecerá a mesma. Ninguém pode acessar sua conta sem este link.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <p style="color: #52525b; font-size: 11px; text-align: center; margin: 24px 0 0 0; line-height: 1.6;">
                Problemas com o botão? Copie e cole este link no navegador:<br>
                <a href="${resetUrl}" style="color: #7c3aed; word-break: break-all; text-decoration: none;">${resetUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
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

        <!-- Texto fora do card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; margin-top: 24px;">
          <tr>
            <td style="text-align: center;">
              <p style="color: #3f3f46; font-size: 11px; margin: 0;">
                Você está recebendo este email porque solicitou a recuperação de senha.<br>
                Se não foi você, pode ignorar esta mensagem com segurança.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}

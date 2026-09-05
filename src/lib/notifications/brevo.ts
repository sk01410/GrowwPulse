// Brevo (Sendinblue) Transactional Email Service
// Sends clean, Groww-styled HTML market digest emails

export interface EmailDigestPayload {
  toEmail: string;
  userName?: string;
  subject: string;
  headline: string;
  absenceDuration: string;
  attentionItems: Array<{
    symbol: string;
    companyName: string;
    changePct: number;
    currentPrice: number;
    explanation: string;
    watchReason?: string | null;
  }>;
  calmSummary?: string;
  niftyContext?: string;
  dashboardUrl: string;
}

export async function sendPulseEmailDigest(payload: EmailDigestPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'notifications@growwpulse.local';
  const senderName = process.env.BREVO_SENDER_NAME || 'GrowwPulse';

  const htmlContent = generateGrowwPulseHtmlEmail(payload);

  if (!apiKey || apiKey === 'placeholder_brevo_api_key') {
    console.log(`[Brevo Email Mock] Simulated sending email to ${payload.toEmail} with subject "${payload.subject}".`);
    return {
      success: true,
      messageId: `mock-brevo-${Date.now()}`
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: payload.toEmail, name: payload.userName || 'Investor' }],
        subject: payload.subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Brevo Email Error]', errorData);
      return { success: false, error: JSON.stringify(errorData) };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    console.error('[Brevo Email Exception]', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

function generateGrowwPulseHtmlEmail(p: EmailDigestPayload): string {
  const hasAlerts = p.attentionItems.length > 0;
  
  const alertCardsHtml = p.attentionItems.map(item => {
    const isUp = item.changePct >= 0;
    const color = isUp ? '#00B386' : '#EB5B3C';
    const bgPill = isUp ? '#EAF8F3' : '#FDECEC';
    const sign = isUp ? '+' : '';
    
    return `
      <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="font-size: 16px; font-weight: 700; color: #1E222B;">${item.symbol}</span>
              <span style="font-size: 12px; color: #6A7282; margin-left: 6px;">${item.companyName}</span>
              ${item.watchReason ? `<span style="font-size: 10px; background: #F0F3F7; color: #44475B; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase;">${item.watchReason.replace('_', ' ')}</span>` : ''}
            </td>
            <td align="right">
              <span style="font-size: 14px; font-weight: 700; color: ${color}; background: ${bgPill}; padding: 4px 8px; border-radius: 6px; font-family: monospace;">
                ${sign}${item.changePct.toFixed(2)}%
              </span>
            </td>
          </tr>
        </table>
        <div style="margin-top: 10px; font-size: 13px; color: #44475B; line-height: 1.5; border-left: 3px solid ${color}; padding-left: 10px;">
          ${item.explanation}
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E222B;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F9FA; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #F0F3F7;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 20px; font-weight: 800; color: #00B386; letter-spacing: -0.5px;">
                      Groww<span style="color: #1E222B;">Pulse</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 600; color: #6A7282; background: #F0F3F7; padding: 4px 8px; border-radius: 12px;">
                      Away: ${p.absenceDuration}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 24px;">
              <h1 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #1E222B;">
                ${p.headline}
              </h1>

              ${!hasAlerts ? `
                <div style="background: #EAF8F3; border: 1px solid #B8EAD9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <div style="font-size: 28px; margin-bottom: 8px;">🧘‍♂️</div>
                  <div style="font-size: 16px; font-weight: 700; color: #00B386; margin-bottom: 6px;">You Can Relax</div>
                  <div style="font-size: 13px; color: #44475B; line-height: 1.5;">
                    ${p.calmSummary || "None of your watchlist stocks made unusual or statistically significant moves during your absence."}
                  </div>
                  ${p.niftyContext ? `<div style="font-size: 11px; color: #6A7282; margin-top: 10px;">${p.niftyContext}</div>` : ''}
                </div>
              ` : `
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #44475B; line-height: 1.5;">
                  Here are the noteworthy anomalies detected across your watchlist during your absence:
                </p>
                ${alertCardsHtml}
              `}

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
                <a href="${p.dashboardUrl}" style="display: inline-block; background-color: #00B386; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                  Open GrowwPulse Dashboard →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F8F9FA; padding: 16px 24px; border-top: 1px solid #F0F3F7; text-align: center; font-size: 11px; color: #9CA3AF;">
              GrowwPulse evaluates statistical anomalies over your absence interval. Not investment advice.<br>
              <a href="${p.dashboardUrl}/notifications" style="color: #6A7282; text-decoration: underline; margin-top: 6px; display: inline-block;">Manage Notification Preferences</a>
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

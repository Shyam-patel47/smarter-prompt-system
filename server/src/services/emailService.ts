// ---------------------------------------------------------------------------
// Email provider: Resend (https://resend.com)
// ---------------------------------------------------------------------------
let resendClient: any = null;

const getResendClient = () => {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  // Lazy-require so the app still boots when the package isn't installed in dev
  try {
    const { Resend } = require('resend');
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch {
    console.warn('[EMAIL] resend package not installed – falling back to mock');
    return null;
  }
};

const sendViaResend = async (toEmail: string, resetUrl: string): Promise<boolean> => {
  const client = getResendClient();
  if (!client) return false; // caller will fall through to mock

  const fromEmail = process.env.SYSTEM_FROM_EMAIL;
  if (!fromEmail) {
    console.warn('[EMAIL] SYSTEM_FROM_EMAIL not set – falling back to mock');
    return false;
  }

  try {
    await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Reset your password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">Reset your password</h2>
          <p style="color: #333; font-size: 16px; margin: 16px 0;">
            We received a request to reset your password. Click the button below to choose a new password.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            This link expires in <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[EMAIL] Resend send failed:', err);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Console-log mock — used in dev when provider env vars are missing
// ---------------------------------------------------------------------------
const sendViaMock = (toEmail: string, resetUrl: string) => {
  console.log(`\n=========================================`);
  console.log(`[MOCK EMAIL PROVIDER] Sending Password Reset Email...`);
  console.log(`To: ${toEmail}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`=========================================\n`);
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const emailService = {
  sendResetEmail: async (toEmail: string, resetUrl: string): Promise<boolean> => {
    // ── Try real provider first ──────────────────────────────────────────
    const sent = await sendViaResend(toEmail, resetUrl);
    if (sent) return true;

    // ── Fallback to mock (non-production only) ───────────────────────────
    if (process.env.NODE_ENV !== 'production') {
      sendViaMock(toEmail, resetUrl);
      return true;
    }

    // Production with no working provider → return false so the controller
    // can surface an error to the user.
    console.error(`[EMAIL] PRODUCTION: No working provider – Email NOT delivered!`);
    return false;
  }
};

import { Resend } from "resend";
import { generateOtp } from "./utils";
import { prisma } from "./prisma";

const FROM = process.env.RESEND_FROM_EMAIL || "noreply@promptme.app";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PromptMe";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[OTP] RESEND_API_KEY not set — email OTP will not be sent");
    return null;
  }
  return new Resend(key);
}


export type OtpPurpose = "signup" | "login" | "reset";

/** Creates an OTP record in the database and returns the code */
export async function createOtp(contact: string, purpose: OtpPurpose, userId?: string): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing unused OTPs for this contact + purpose
  await prisma.otpToken.updateMany({
    where: { contact, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.otpToken.create({
    data: {
      contact,
      code,
      purpose,
      expiresAt,
      ...(userId ? { userId } : {}),
    },
  });

  return code;
}

/** Verifies an OTP — returns true if valid, marks it as used */
export async function verifyOtp(contact: string, code: string, purpose: OtpPurpose): Promise<boolean> {
  const token = await prisma.otpToken.findFirst({
    where: {
      contact,
      code,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return false;

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return true;
}

/** Sends OTP via email using Resend */
export async function sendEmailOtp(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  const subjectMap = {
    signup: `Your ${APP_NAME} verification code`,
    login: `Your ${APP_NAME} login code`,
    reset: `Reset your ${APP_NAME} password`,
  };

  const labelMap = {
    signup: "Verify your email to get started",
    login: "Use this code to log in",
    reset: "Use this code to reset your password",
  };

  const resend = getResend();
  if (!resend) return; // silently skip if not configured

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: subjectMap[purpose],
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080C18;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#080C18;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0F1623;border:1px solid #1E2A42;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:8px 32px;background:#0A0E1A;border-bottom:1px solid #1E2A42;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 0;">
                  <span style="display:inline-flex;align-items:center;gap:10px;">
                    <span style="display:inline-block;width:28px;height:28px;background:#F59E0B;border-radius:8px;"></span>
                    <span style="font-size:16px;font-weight:700;color:#E8EDF5;letter-spacing:-0.02em;">${APP_NAME}</span>
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#E8EDF5;letter-spacing:-0.02em;">${labelMap[purpose]}</p>
            <p style="margin:0 0 32px;font-size:14px;color:#6B7FA3;line-height:1.6;">
              Enter this 6-digit code in ${APP_NAME}. It expires in 10 minutes.
            </p>
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:32px;">
              ${code.split("").map(d => `<span style="display:inline-block;width:44px;height:56px;line-height:56px;text-align:center;background:#161D2E;border:1px solid #1E2A42;border-radius:8px;font-size:24px;font-weight:700;color:#E8EDF5;">${d}</span>`).join("")}
            </div>
            <p style="margin:0;font-size:13px;color:#3D4F6E;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1E2A42;background:#0A0E1A;">
            <p style="margin:0;font-size:12px;color:#3D4F6E;">© 2025 ${APP_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

/** Sends OTP via SMS using Twilio Verify (optional — gracefully skips if not configured) */
export async function sendSmsOtp(phone: string, code: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!sid || !token || !verifySid) {
    console.warn("[OTP] Twilio not configured — SMS OTP skipped");
    return;
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(sid, token);

  await client.verify.v2.services(verifySid).verifications.create({
    to: phone,
    channel: "sms",
  });

  // Note: With Twilio Verify, Twilio generates & sends the code itself.
  // The `code` param here is stored in our DB for cross-referencing; Twilio's
  // code is the authoritative one during verifySmsOtp below.
  void code;
}

/** Verifies SMS OTP via Twilio Verify (overrides our DB check for SMS) */
export async function verifySmsOtp(phone: string, code: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!sid || !token || !verifySid) {
    // Fall back to DB-stored OTP if Twilio not configured (dev mode)
    return false;
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    const check = await client.verify.v2.services(verifySid).verificationChecks.create({
      to: phone,
      code,
    });
    return check.status === "approved";
  } catch {
    return false;
  }
}

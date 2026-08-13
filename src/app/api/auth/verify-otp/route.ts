export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp, verifySmsOtp } from "@/lib/otp";
import { isPhone } from "@/lib/utils";

const schema = z.object({
  contact: z.string().min(1),
  code: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum(["signup", "login", "reset"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { contact, code, purpose } = parsed.data;
    const usingPhone = isPhone(contact);

    let verified = false;

    if (usingPhone) {
      // Try Twilio Verify first, fall back to DB OTP
      verified = await verifySmsOtp(contact, code);
      if (!verified) {
        verified = await verifyOtp(contact, code, purpose);
      }
    } else {
      verified = await verifyOtp(contact, code, purpose);
    }

    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    if (purpose === "signup") {
      // Mark user as verified
      const user = await prisma.user.findFirst({
        where: isPhone(contact) ? { phone: contact } : { email: contact },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error("[VERIFY_OTP]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

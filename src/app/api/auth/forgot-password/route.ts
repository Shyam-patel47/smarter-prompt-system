export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp, sendEmailOtp, sendSmsOtp } from "@/lib/otp";
import { isEmail, isPhone, normalizePhone } from "@/lib/utils";

const schema = z.object({
  contact: z.string().min(1, "Email or phone is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    let { contact } = parsed.data;
    const usingEmail = isEmail(contact);
    const usingPhone = isPhone(contact);

    if (!usingEmail && !usingPhone) {
      return NextResponse.json({ error: "Enter a valid email or phone number" }, { status: 400 });
    }

    if (usingPhone) contact = normalizePhone(contact);

    const user = await prisma.user.findFirst({
      where: usingEmail ? { email: contact } : { phone: contact },
    });

    // Always return success to prevent user enumeration
    if (!user || !user.isVerified) {
      return NextResponse.json({ success: true });
    }

    const code = await createOtp(contact, "reset", user.id);

    if (usingEmail) {
      await sendEmailOtp(contact, code, "reset");
    } else {
      await sendSmsOtp(contact, code);
    }

    return NextResponse.json({ success: true, method: usingEmail ? "email" : "sms" });
  } catch (err) {
    console.error("[FORGOT_PASSWORD]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

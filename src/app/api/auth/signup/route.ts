export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp, sendEmailOtp, sendSmsOtp } from "@/lib/otp";
import { isEmail, isPhone, normalizePhone } from "@/lib/utils";
import bcrypt from "bcryptjs";

const schema = z.object({
  contact: z.string().min(1, "Email or phone is required"),
  name: z.string().min(1, "Name is required").max(80),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let { contact, name, password } = parsed.data;
    const usingEmail = isEmail(contact);
    const usingPhone = isPhone(contact);

    if (!usingEmail && !usingPhone) {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number" },
        { status: 400 }
      );
    }

    if (usingPhone) contact = normalizePhone(contact);

    // Check if user already exists and is verified
    const existing = await prisma.user.findFirst({
      where: usingEmail ? { email: contact } : { phone: contact },
    });

    if (existing?.isVerified) {
      return NextResponse.json(
        { error: "An account with this email/phone already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Upsert user (unverified)
    const user = await prisma.user.upsert({
      where: usingEmail ? { email: contact } : { phone: contact },
      update: { name, passwordHash, authProvider: usingEmail ? "email" : "phone" },
      create: {
        ...(usingEmail ? { email: contact } : { phone: contact }),
        name,
        passwordHash,
        authProvider: usingEmail ? "email" : "phone",
        isVerified: false,
      },
    });

    // Generate & send OTP
    const code = await createOtp(contact, "signup", user.id);

    if (usingEmail) {
      await sendEmailOtp(contact, code, "signup");
    } else {
      await sendSmsOtp(contact, code);
    }

    return NextResponse.json({ success: true, contact, method: usingEmail ? "email" : "sms" });
  } catch (err) {
    console.error("[SIGNUP]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

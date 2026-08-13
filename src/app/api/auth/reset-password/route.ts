export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp, verifySmsOtp } from "@/lib/otp";
import { isPhone } from "@/lib/utils";
import bcrypt from "bcryptjs";

const schema = z.object({
  contact: z.string().min(1),
  code: z.string().length(6),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { contact, code, newPassword } = parsed.data;
    const usingPhone = isPhone(contact);

    let verified = false;
    if (usingPhone) {
      verified = await verifySmsOtp(contact, code);
      if (!verified) verified = await verifyOtp(contact, code, "reset");
    } else {
      verified = await verifyOtp(contact, code, "reset");
    }

    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: usingPhone ? { phone: contact } : { email: contact },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RESET_PASSWORD]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

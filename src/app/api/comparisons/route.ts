export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  baseTaskDescription: z.string().default(""),
  promptABody: z.string().min(1),
  promptAScore: z.number().min(0).max(100).nullable().optional(),
  promptBBody: z.string().min(1),
  promptBScore: z.number().min(0).max(100).nullable().optional(),
  winner: z.enum(["a", "b", "tie", "none"]).default("none"),
  promptAId: z.string().uuid().optional(),
  promptBId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const comparison = await prisma.comparison.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ comparison }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comparisons = await prisma.comparison.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ comparisons });
}

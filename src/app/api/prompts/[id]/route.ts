export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

async function getPromptAndVerifyOwner(id: string, userId: string) {
  const prompt = await prisma.prompt.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      variables: { orderBy: { orderIndex: "asc" } },
      tags: { include: { tag: true } },
      folder: true,
      versions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  return prompt;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prompt = await getPromptAndVerifyOwner(id, session.user.id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment usage count
  await prisma.prompt.update({ where: { id }, data: { usageCount: { increment: 1 } } });

  return NextResponse.json({ prompt });
}

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  taskType: z.string().optional(),
  detailsInput: z.string().optional(),
  tone: z.string().optional(),
  outputFormat: z.string().optional(),
  targetModel: z.string().nullable().optional(),
  generatedBody: z.string().optional(),
  isTemplate: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  folderId: z.string().uuid().nullable().optional(),
  variables: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    defaultValue: z.string().optional(),
    orderIndex: z.number().default(0),
  })).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
}).partial();

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await getPromptAndVerifyOwner(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { variables, tagIds, ...data } = parsed.data;

  // Save version if body changed
  if (data.generatedBody && data.generatedBody !== existing.generatedBody) {
    await prisma.promptVersion.create({
      data: { promptId: id, bodySnapshot: existing.generatedBody },
    });
  }

  // Update prompt
  const prompt = await prisma.$transaction(async (tx) => {
    if (variables !== undefined) {
      await tx.promptVariable.deleteMany({ where: { promptId: id } });
      if (variables.length > 0) {
        await tx.promptVariable.createMany({
          data: variables.map(v => ({ ...v, promptId: id })),
        });
      }
    }

    if (tagIds !== undefined) {
      await tx.promptTag.deleteMany({ where: { promptId: id } });
      if (tagIds.length > 0) {
        await tx.promptTag.createMany({
          data: tagIds.map(tagId => ({ promptId: id, tagId })),
        });
      }
    }

    return tx.prompt.update({
      where: { id },
      data,
      include: {
        variables: { orderBy: { orderIndex: "asc" } },
        tags: { include: { tag: true } },
        versions: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  });

  return NextResponse.json({ prompt });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await getPromptAndVerifyOwner(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete
  await prisma.prompt.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

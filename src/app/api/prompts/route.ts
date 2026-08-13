export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  taskType: z.string().min(1),
  detailsInput: z.string().min(1),
  tone: z.string().min(1),
  outputFormat: z.string().min(1),
  targetModel: z.string().optional(),
  generatedBody: z.string().min(1),
  isTemplate: z.boolean().default(false),
  folderId: z.string().uuid().optional(),
  variables: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    defaultValue: z.string().optional(),
    orderIndex: z.number().default(0),
  })).default([]),
  tagIds: z.array(z.string().uuid()).default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const folderId = searchParams.get("folderId");
  const favorite = searchParams.get("favorite") === "1";
  const template = searchParams.get("template") === "1";
  const tagId = searchParams.get("tagId");
  const sort = searchParams.get("sort") ?? "updated";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const where = {
    userId: session.user.id,
    deletedAt: null,
    ...(search ? {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { generatedBody: { contains: search, mode: "insensitive" as const } },
        { tags: { some: { tag: { name: { contains: search, mode: "insensitive" as const } } } } },
      ]
    } : {}),
    ...(folderId ? { folderId } : {}),
    ...(favorite ? { isFavorite: true } : {}),
    ...(template ? { isTemplate: true } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
  };

  const orderBy = sort === "alpha"
    ? { title: "asc" as const }
    : sort === "used"
    ? { usageCount: "desc" as const }
    : { updatedAt: "desc" as const };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tags: { include: { tag: true } },
        folder: true,
        variables: { orderBy: { orderIndex: "asc" } },
      },
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({ prompts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { variables, tagIds, ...data } = parsed.data;

  // Save version on existing prompt if re-saving (not applicable for new prompts)
  const prompt = await prisma.prompt.create({
    data: {
      ...data,
      userId: session.user.id,
      variables: {
        create: variables,
      },
      ...(tagIds.length > 0 ? {
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        }
      } : {}),
    },
    include: {
      variables: true,
      tags: { include: { tag: true } },
    },
  });

  // Also save initial version snapshot
  await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      bodySnapshot: prompt.generatedBody,
    },
  });

  return NextResponse.json({ prompt }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const createPaperSchema = z.object({
  arxivId: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string()),
  abstract: z.string(),
  url: z.string().url(),
  pdfUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  categories: z.array(z.string()).default([]),
  status: z.enum(["TO_READ", "READING", "DONE"]).default("TO_READ"),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const tagId = searchParams.get("tagId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { userId };

  if (status && ["TO_READ", "READING", "DONE"].includes(status)) {
    where.status = status;
  }

  if (tagId) {
    where.tags = {
      some: { tagId },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { abstract: { contains: search, mode: "insensitive" } },
      { authors: { hasSome: [search] } },
    ];
  }

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.paper.count({ where }),
  ]);

  return NextResponse.json({
    papers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = createPaperSchema.parse(body);

    // Ensure user exists in database (since we use JWT-only auth)
    await prisma.user.upsert({
      where: { id: userId! },
      update: {},
      create: { id: userId! },
    });

    const existingPaper = await prisma.paper.findUnique({
      where: {
        arxivId_userId: {
          arxivId: data.arxivId,
          userId: userId!,
        },
      },
    });

    if (existingPaper) {
      return NextResponse.json(
        { error: "Paper already in your library" },
        { status: 409 }
      );
    }

    const { tagIds, ...paperData } = data;

    const paper = await prisma.paper.create({
      data: {
        ...paperData,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        userId: userId!,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return NextResponse.json(paper, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Error adding paper:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to add paper", details: errorMessage },
      { status: 500 }
    );
  }
}

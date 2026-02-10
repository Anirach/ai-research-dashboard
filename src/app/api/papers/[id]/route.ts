import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const updatePaperSchema = z.object({
  status: z.enum(["TO_READ", "READING", "DONE"]).optional(),
  notes: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const paper = await prisma.paper.findFirst({
    where: { id, userId: userId! },
    include: {
      tags: {
        include: { tag: true },
      },
      citations: {
        include: { citedPaper: true },
      },
      citedBy: {
        include: { citingPaper: true },
      },
    },
  });

  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  return NextResponse.json(paper);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existingPaper = await prisma.paper.findFirst({
    where: { id, userId: userId! },
  });

  if (!existingPaper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updatePaperSchema.parse(body);
    const { tagIds, ...updateData } = data;

    if (tagIds !== undefined) {
      await prisma.paperTag.deleteMany({
        where: { paperId: id },
      });

      if (tagIds.length > 0) {
        await prisma.paperTag.createMany({
          data: tagIds.map((tagId) => ({ paperId: id, tagId })),
        });
      }
    }

    const paper = await prisma.paper.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return NextResponse.json(paper);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existingPaper = await prisma.paper.findFirst({
    where: { id, userId: userId! },
  });

  if (!existingPaper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  await prisma.paper.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

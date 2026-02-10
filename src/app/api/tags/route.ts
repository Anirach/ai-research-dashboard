import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
});

export async function GET() {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const tags = await prisma.tag.findMany({
    where: { userId: userId! },
    include: {
      _count: {
        select: { papers: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = createTagSchema.parse(body);

    const existingTag = await prisma.tag.findUnique({
      where: {
        name_userId: {
          name: data.name,
          userId: userId!,
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        ...data,
        userId: userId!,
      },
    });

    return NextResponse.json(tag, { status: 201 });
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

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existingTag = await prisma.tag.findFirst({
    where: { id, userId: userId! },
  });

  if (!existingTag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateTagSchema.parse(body);

    if (data.name && data.name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findUnique({
        where: {
          name_userId: {
            name: data.name,
            userId: userId!,
          },
        },
      });

      if (duplicateTag) {
        return NextResponse.json(
          { error: "Tag with this name already exists" },
          { status: 409 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data,
    });

    return NextResponse.json(tag);
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

  const existingTag = await prisma.tag.findFirst({
    where: { id, userId: userId! },
  });

  if (!existingTag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await prisma.tag.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

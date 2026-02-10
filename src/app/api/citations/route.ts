import { NextRequest, NextResponse } from "next/server";
import { buildCitationNetwork, getPaperByArxivId } from "@/lib/services/semantic-scholar";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const arxivIds = searchParams.get("arxivIds")?.split(",");
  const depth = parseInt(searchParams.get("depth") || "1");

  if (!arxivIds || arxivIds.length === 0) {
    const userPapers = await prisma.paper.findMany({
      where: { userId: userId! },
      select: { arxivId: true },
      take: 10,
    });

    if (userPapers.length === 0) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    const paperIds = userPapers.map((p) => p.arxivId);
    const network = await buildCitationNetwork(paperIds, Math.min(depth, 2));
    return NextResponse.json(network);
  }

  try {
    const network = await buildCitationNetwork(arxivIds, Math.min(depth, 2));
    return NextResponse.json(network);
  } catch (err) {
    console.error("Citation network error:", err);
    return NextResponse.json(
      { error: "Failed to build citation network" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { arxivId } = body;

    if (!arxivId) {
      return NextResponse.json(
        { error: "arxivId is required" },
        { status: 400 }
      );
    }

    const paper = await getPaperByArxivId(arxivId);

    if (!paper) {
      return NextResponse.json(
        { error: "Paper not found in Semantic Scholar" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paperId: paper.paperId,
      title: paper.title,
      citationCount: paper.citationCount,
      referenceCount: paper.referenceCount,
    });
  } catch (err) {
    console.error("Citation lookup error:", err);
    return NextResponse.json(
      { error: "Failed to fetch citation data" },
      { status: 500 }
    );
  }
}

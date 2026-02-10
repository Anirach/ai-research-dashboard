import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

function generateBibTeX(papers: {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  publishedAt: Date | null;
  categories: string[];
}[]): string {
  return papers
    .map((paper) => {
      const key = `arxiv_${paper.arxivId.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const year = paper.publishedAt
        ? new Date(paper.publishedAt).getFullYear()
        : "n.d.";
      const month = paper.publishedAt
        ? new Date(paper.publishedAt).toLocaleString("en", { month: "short" }).toLowerCase()
        : "";

      const authors = paper.authors.join(" and ");

      return `@article{${key},
  title = {${escapeBibTeX(paper.title)}},
  author = {${escapeBibTeX(authors)}},
  year = {${year}},${month ? `\n  month = {${month}},` : ""}
  eprint = {${paper.arxivId}},
  archiveprefix = {arXiv},
  primaryclass = {${paper.categories[0] || "cs.AI"}},
  url = {${paper.url}},
  abstract = {${escapeBibTeX(paper.abstract)}}
}`;
    })
    .join("\n\n");
}

function escapeBibTeX(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, (char) => `\\${char}`)
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

export async function GET(request: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const paperIds = searchParams.get("paperIds")?.split(",");
  const format = searchParams.get("format") || "bibtex";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { userId: userId! };

  if (paperIds && paperIds.length > 0) {
    where.id = { in: paperIds };
  }

  if (status) {
    where.status = status;
  }

  const papers = await prisma.paper.findMany({
    where,
    select: {
      arxivId: true,
      title: true,
      authors: true,
      abstract: true,
      url: true,
      publishedAt: true,
      categories: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (papers.length === 0) {
    return NextResponse.json(
      { error: "No papers found to export" },
      { status: 404 }
    );
  }

  if (format === "bibtex") {
    const bibtex = generateBibTeX(papers);

    return new NextResponse(bibtex, {
      headers: {
        "Content-Type": "application/x-bibtex",
        "Content-Disposition": `attachment; filename="papers-${Date.now()}.bib"`,
      },
    });
  }

  if (format === "json") {
    return NextResponse.json(papers);
  }

  return NextResponse.json(
    { error: "Unsupported format. Use 'bibtex' or 'json'" },
    { status: 400 }
  );
}

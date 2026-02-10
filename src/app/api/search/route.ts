import { NextRequest, NextResponse } from "next/server";
import { searchPapers } from "@/lib/services/semantic-scholar";
import { searchArxivPapers } from "@/lib/services/arxiv";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const source = searchParams.get("source") || "all";
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const results: {
      arxiv?: unknown[];
      semanticScholar?: unknown[];
    } = {};

    if (source === "all" || source === "arxiv") {
      try {
        const arxivPapers = await searchArxivPapers(query, limit);
        results.arxiv = arxivPapers;
      } catch (err) {
        console.error("arXiv search error:", err);
        results.arxiv = [];
      }
    }

    if (source === "all" || source === "semanticscholar") {
      try {
        const ssResult = await searchPapers(query, { limit });
        results.semanticScholar = ssResult.data;
      } catch (err) {
        console.error("Semantic Scholar search error:", err);
        results.semanticScholar = [];
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

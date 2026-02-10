import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPapers, searchArxivPapers, fetchPaperByArxivId } from "@/lib/services/arxiv";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "latest";
  const query = searchParams.get("query");
  const arxivId = searchParams.get("arxivId");
  const categories = searchParams.get("categories")?.split(",");
  const keywords = searchParams.get("keywords")?.split(",");
  const maxResults = parseInt(searchParams.get("maxResults") || "50");
  const start = parseInt(searchParams.get("start") || "0");

  try {
    if (action === "search" && query) {
      const papers = await searchArxivPapers(query, maxResults);
      return NextResponse.json({ papers });
    }

    if (action === "get" && arxivId) {
      const paper = await fetchPaperByArxivId(arxivId);
      if (!paper) {
        return NextResponse.json({ error: "Paper not found" }, { status: 404 });
      }
      return NextResponse.json({ paper });
    }

    const result = await fetchArxivPapers({
      categories,
      keywords: keywords?.filter(Boolean),
      maxResults,
      start,
    });

    return NextResponse.json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("arXiv API error:", errorMessage, err);
    return NextResponse.json(
      {
        error: "Failed to fetch from arXiv",
        details: errorMessage,
        papers: []
      },
      { status: 500 }
    );
  }
}

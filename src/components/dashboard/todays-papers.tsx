"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_LABELS } from "@/lib/services/arxiv";

interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl: string;
  publishedAt: string;
  categories: string[];
}

export function TodaysPapers() {
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/arxiv?maxResults=10");
      const data = await res.json();

      if (!res.ok) {
        console.error("arXiv API error:", data);
        toast.error(data.details || "Failed to fetch latest papers");
        setPapers([]);
        return;
      }

      setPapers(data.papers || []);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      toast.error("Failed to fetch latest papers");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const addToLibrary = async (paper: ArxivPaper) => {
    setAdding(paper.arxivId);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arxivId: paper.arxivId,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          publishedAt: paper.publishedAt,
          categories: paper.categories,
        }),
      });

      if (res.status === 409) {
        toast.info("Paper already in your library");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to add paper");
      }

      toast.success("Paper added to your library");
    } catch (error) {
      console.error("Failed to add paper:", error);
      toast.error("Failed to add paper to library");
    } finally {
      setAdding(null);
    }
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Latest from arXiv</CardTitle>
          <CardDescription>Recent AI/ML papers</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchPapers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : papers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No papers found</p>
          ) : (
            <div className="space-y-4">
              {papers.map((paper) => (
                <div
                  key={paper.arxivId}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <h4 className="font-medium text-sm line-clamp-2">{paper.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {paper.authors.slice(0, 3).join(", ")}
                    {paper.authors.length > 3 && " et al."}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {paper.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[cat] || cat}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToLibrary(paper)}
                      disabled={adding === paper.arxivId}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {adding === paper.arxivId ? "Adding..." : "Add"}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={paper.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

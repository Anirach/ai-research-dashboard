"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
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
    <Card className="lg:col-span-1 border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Latest from arXiv</CardTitle>
            <CardDescription>Recent AI/ML papers</CardDescription>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchPapers} 
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-3.5 space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No papers found</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchPapers}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => (
                <div
                  key={paper.arxivId}
                  className="rounded-xl border bg-card p-3.5 space-y-2.5 hover:bg-accent/30 transition-colors"
                >
                  <h4 className="font-medium text-sm line-clamp-2 leading-snug">
                    {paper.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {paper.authors.slice(0, 3).join(", ")}
                    {paper.authors.length > 3 && " et al."}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {paper.categories.slice(0, 2).map((cat) => (
                      <Badge 
                        key={cat} 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0 bg-secondary/50"
                      >
                        {CATEGORY_LABELS[cat] || cat}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => addToLibrary(paper)}
                      disabled={adding === paper.arxivId}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {adding === paper.arxivId ? "Adding..." : "Add"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
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

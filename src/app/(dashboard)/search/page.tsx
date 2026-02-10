"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ExternalLink, BookOpen } from "lucide-react";
import { toast } from "sonner";

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

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  authors: { name: string }[];
  year?: number;
  citationCount?: number;
  url?: string;
  externalIds?: {
    ArXiv?: string;
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [arxivResults, setArxivResults] = useState<ArxivPaper[]>([]);
  const [ssResults, setSsResults] = useState<SemanticScholarPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setArxivResults(data.arxiv || []);
      setSsResults(data.semanticScholar || []);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const addArxivPaper = async (paper: ArxivPaper) => {
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

      if (!res.ok) throw new Error("Failed to add");
      toast.success("Paper added to your library");
    } catch (error) {
      console.error("Failed to add paper:", error);
      toast.error("Failed to add paper");
    } finally {
      setAdding(null);
    }
  };

  const addSsPaper = async (paper: SemanticScholarPaper) => {
    if (!paper.externalIds?.ArXiv) {
      toast.error("This paper doesn't have an arXiv ID");
      return;
    }

    setAdding(paper.paperId);
    try {
      const arxivRes = await fetch(
        `/api/arxiv?action=get&arxivId=${paper.externalIds.ArXiv}`
      );
      const arxivData = await arxivRes.json();

      if (!arxivData.paper) {
        toast.error("Could not find paper on arXiv");
        return;
      }

      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arxivId: arxivData.paper.arxivId,
          title: arxivData.paper.title,
          authors: arxivData.paper.authors,
          abstract: arxivData.paper.abstract,
          url: arxivData.paper.url,
          pdfUrl: arxivData.paper.pdfUrl,
          publishedAt: arxivData.paper.publishedAt,
          categories: arxivData.paper.categories,
        }),
      });

      if (res.status === 409) {
        toast.info("Paper already in your library");
        return;
      }

      if (!res.ok) throw new Error("Failed to add");
      toast.success("Paper added to your library");
    } catch (error) {
      console.error("Failed to add paper:", error);
      toast.error("Failed to add paper");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Papers</h1>
        <p className="text-muted-foreground">
          Search arXiv and Semantic Scholar for research papers
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for papers (e.g., transformer, attention mechanism)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {searched && (
        <Tabs defaultValue="arxiv" className="w-full">
          <TabsList>
            <TabsTrigger value="arxiv">
              arXiv ({arxivResults.length})
            </TabsTrigger>
            <TabsTrigger value="semantic-scholar">
              Semantic Scholar ({ssResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arxiv" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : arxivResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results found on arXiv
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {arxivResults.map((paper) => (
                  <Card key={paper.arxivId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold line-clamp-2">
                            {paper.title}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-1">
                            {paper.authors.slice(0, 3).join(", ")}
                            {paper.authors.length > 3 && " et al."}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">arXiv:{paper.arxivId}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {paper.abstract}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {paper.categories.slice(0, 4).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => addArxivPaper(paper)}
                          disabled={adding === paper.arxivId}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {adding === paper.arxivId ? "Adding..." : "Add to Library"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={paper.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            arXiv
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <BookOpen className="h-4 w-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="semantic-scholar" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ssResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results found on Semantic Scholar
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {ssResults.map((paper) => (
                  <Card key={paper.paperId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold line-clamp-2">
                            {paper.title}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-1">
                            {paper.authors.slice(0, 3).map((a) => a.name).join(", ")}
                            {paper.authors.length > 3 && " et al."}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {paper.year && (
                            <Badge variant="outline">{paper.year}</Badge>
                          )}
                          {paper.citationCount !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {paper.citationCount.toLocaleString()} citations
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {paper.abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {paper.abstract}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        {paper.externalIds?.ArXiv ? (
                          <Button
                            size="sm"
                            onClick={() => addSsPaper(paper)}
                            disabled={adding === paper.paperId}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {adding === paper.paperId ? "Adding..." : "Add to Library"}
                          </Button>
                        ) : (
                          <Button size="sm" disabled variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            No arXiv ID
                          </Button>
                        )}
                        {paper.url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={paper.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!searched && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Enter a search query to find research papers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

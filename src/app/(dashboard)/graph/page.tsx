"use client";

import { useState, useEffect } from "react";
import { CitationNetwork } from "@/components/graph/citation-network";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Maximize2, Minimize2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Node {
  id: string;
  arxivId?: string;
  title: string;
  citationCount?: number;
}

interface Link {
  source: string;
  target: string;
}

export default function GraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/citations?depth=1");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNodes(data.nodes || []);
      setLinks(data.links || []);
    } catch (error) {
      console.error("Failed to fetch citation network:", error);
      toast.error("Failed to load citation network");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const addToLibrary = async (arxivId: string) => {
    if (!arxivId) {
      toast.error("No arXiv ID available");
      return;
    }

    setAdding(true);
    try {
      // First, fetch full paper details from arXiv
      const arxivRes = await fetch(`/api/arxiv?action=get&arxivId=${arxivId}`);
      if (!arxivRes.ok) {
        throw new Error("Failed to fetch paper details");
      }
      const { paper } = await arxivRes.json();

      if (!paper) {
        toast.error("Paper not found on arXiv");
        return;
      }

      // Add to library
      const addRes = await fetch("/api/papers", {
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

      if (addRes.status === 409) {
        toast.info("Paper already in your library");
        return;
      }

      if (!addRes.ok) {
        const error = await addRes.json();
        throw new Error(error.details || "Failed to add paper");
      }

      toast.success("Paper added to your library");
      await fetchNetwork(); // Refresh to show updated colors
    } catch (error) {
      console.error("Failed to add paper:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add paper");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citation Network</h1>
          <p className="text-muted-foreground">
            Visualize relationships between papers
          </p>
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citation Network</h1>
          <p className="text-muted-foreground">
            Visualize relationships between papers
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No papers in your library yet. Add some papers to see their citation network.
            </p>
            <Button asChild variant="outline">
              <a href="/search">Search Papers</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${fullscreen ? "fixed inset-0 z-50 bg-background p-4" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citation Network</h1>
          <p className="text-muted-foreground">
            {nodes.length} papers, {links.length} connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchNetwork} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${selectedNode ? "lg:grid-cols-4" : ""}`}>
        <div className={selectedNode ? "lg:col-span-3" : ""}>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className={fullscreen ? "h-[calc(100vh-200px)]" : "h-[600px]"}>
                <CitationNetwork
                  nodes={nodes}
                  links={links}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#6366f1]" />
              <span>In your library</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#94a3b8]" />
              <span>Referenced papers</span>
            </div>
          </div>
        </div>

        {selectedNode && (
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Selected Paper</CardTitle>
              <CardDescription>Click a node to see details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-medium text-sm leading-tight">
                {selectedNode.title}
              </h3>
              {selectedNode.arxivId && (
                <Badge variant="outline">arXiv:{selectedNode.arxivId}</Badge>
              )}
              {selectedNode.citationCount !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {selectedNode.citationCount.toLocaleString()} citations
                </p>
              )}
              {selectedNode.arxivId && (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => addToLibrary(selectedNode.arxivId!)}
                    disabled={adding}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {adding ? "Adding..." : "Add to Library"}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://arxiv.org/abs/${selectedNode.arxivId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on arXiv
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

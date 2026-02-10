"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaperCard } from "@/components/papers/paper-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, X } from "lucide-react";
import { toast } from "sonner";

interface PaperTag {
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

interface Paper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl?: string;
  status: "TO_READ" | "READING" | "DONE";
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  tags: PaperTag[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { papers: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PapersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get("status") || "";
  const tagId = searchParams.get("tagId") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (tagId) params.set("tagId", tagId);
      if (search) params.set("search", search);
      params.set("page", page.toString());

      const res = await fetch(`/api/papers?${params}`);
      const data = await res.json();
      setPapers(data.papers || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      toast.error("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  }, [status, tagId, search, page]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  useEffect(() => {
    fetchPapers();
    fetchTags();
  }, [fetchPapers]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/papers?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/papers");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this paper?")) return;

    try {
      const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Paper deleted");
      fetchPapers();
    } catch (error) {
      console.error("Failed to delete paper:", error);
      toast.error("Failed to delete paper");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Status updated");
      fetchPapers();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const exportBibTeX = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);

      const res = await fetch(`/api/export?format=bibtex&${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `papers-${Date.now()}.bib`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Papers exported");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export papers");
    }
  };

  const hasFilters = status || tagId || search;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Papers</h1>
          <p className="text-muted-foreground">
            {pagination?.total || 0} papers in your library
          </p>
        </div>
        <Button onClick={exportBibTeX} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export BibTeX
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            value={search}
            onChange={(e) => updateFilters("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => updateFilters("status", v)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="TO_READ">To Read</SelectItem>
            <SelectItem value="READING">Reading</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagId} onValueChange={(v) => updateFilters("tagId", v)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name} ({tag._count.papers})
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {hasFilters ? "No papers match your filters" : "No papers in your library yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => updateFilters("page", (page - 1).toString())}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => updateFilters("page", (page + 1).toString())}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

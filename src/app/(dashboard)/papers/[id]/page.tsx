"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Star,
  Save,
  Trash2,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { TagSelector } from "@/components/papers/tag-selector";

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
  publishedAt?: string;
  categories: string[];
  status: "TO_READ" | "READING" | "DONE";
  notes?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  tags: PaperTag[];
}

export default function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const fetchPaper = useCallback(async () => {
    try {
      const res = await fetch(`/api/papers/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Paper not found");
          router.push("/papers");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setPaper(data);
      setNotes(data.notes || "");
      setStatus(data.status);
      setRating(data.rating || 0);
      setSelectedTagIds(data.tags.map((t: PaperTag) => t.tag.id));
    } catch (error) {
      console.error("Failed to fetch paper:", error);
      toast.error("Failed to load paper");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchPaper();
  }, [fetchPaper]);

  const savePaper = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          status,
          rating: rating || null,
          tagIds: selectedTagIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setPaper({ ...paper!, ...updated });
      toast.success("Paper saved");
    } catch (error) {
      console.error("Failed to save paper:", error);
      toast.error("Failed to save paper");
    } finally {
      setSaving(false);
    }
  };

  const deletePaper = async () => {
    if (!confirm("Are you sure you want to delete this paper?")) return;

    try {
      const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Paper deleted");
      router.push("/papers");
    } catch (error) {
      console.error("Failed to delete paper:", error);
      toast.error("Failed to delete paper");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!paper) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/papers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <Badge variant="outline" className="mb-2">
            arXiv:{paper.arxivId}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">{paper.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Abstract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {paper.abstract}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Your personal notes about this paper
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <Button onClick={savePaper} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Authors:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {paper.authors.map((author, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {author}
                  </Badge>
                ))}
              </div>

              {paper.publishedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Published:</span>
                  <span>{format(new Date(paper.publishedAt), "MMM d, yyyy")}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Categories:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {paper.categories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a href={paper.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    arXiv
                  </a>
                </Button>
                {paper.pdfUrl && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO_READ">To Read</SelectItem>
                    <SelectItem value="READING">Reading</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRating(value === rating ? 0 : value)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          value <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={deletePaper} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Paper
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

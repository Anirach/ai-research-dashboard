"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, FileText, MoreVertical, Star, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface PaperCardProps {
  paper: Paper;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const statusColors = {
  TO_READ: "outline",
  READING: "secondary",
  DONE: "default",
} as const;

export function PaperCard({ paper, onDelete, onStatusChange }: PaperCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/papers/${paper.id}`} className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2 hover:text-primary transition-colors">
              {paper.title}
            </CardTitle>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={paper.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on arXiv
                </a>
              </DropdownMenuItem>
              {paper.pdfUrl && (
                <DropdownMenuItem asChild>
                  <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Open PDF
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onStatusChange?.(paper.id, "TO_READ")}
                disabled={paper.status === "TO_READ"}
              >
                Mark as To Read
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange?.(paper.id, "READING")}
                disabled={paper.status === "READING"}
              >
                Mark as Reading
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange?.(paper.id, "DONE")}
                disabled={paper.status === "DONE"}
              >
                Mark as Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(paper.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-1 text-xs">
          {paper.authors.slice(0, 3).join(", ")}
          {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{paper.abstract}</p>
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusColors[paper.status]}>
              {paper.status.replace("_", " ")}
            </Badge>
            {paper.rating && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: paper.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(paper.createdAt), { addSuffix: true })}
          </span>
        </div>
        {paper.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {paper.tags.map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ borderColor: tag.color, color: tag.color }}
                className="text-xs"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

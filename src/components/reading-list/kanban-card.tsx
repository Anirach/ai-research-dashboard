"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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
  status: "TO_READ" | "READING" | "DONE";
  rating?: number | null;
  tags: PaperTag[];
}

interface KanbanCardProps {
  paper: Paper;
  isDragging?: boolean;
}

export function KanbanCard({ paper, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: paper.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none",
        dragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <Link
              href={`/papers/${paper.id}`}
              className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {paper.title}
            </Link>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {paper.authors.slice(0, 2).join(", ")}
              {paper.authors.length > 2 && " et al."}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {paper.rating && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: paper.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              )}
              {paper.tags.slice(0, 2).map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderColor: tag.color, color: tag.color }}
                  className="text-xs py-0"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

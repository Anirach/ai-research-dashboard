"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/reading-list/kanban-column";
import { KanbanCard } from "@/components/reading-list/kanban-card";
import { Skeleton } from "@/components/ui/skeleton";
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
  status: "TO_READ" | "READING" | "DONE";
  rating?: number | null;
  tags: PaperTag[];
}

type Status = "TO_READ" | "READING" | "DONE";

const COLUMNS: { id: Status; title: string }[] = [
  { id: "TO_READ", title: "To Read" },
  { id: "READING", title: "Reading" },
  { id: "DONE", title: "Done" },
];

export default function ReadingListPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await fetch("/api/papers?limit=100");
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      toast.error("Failed to load papers");
    } finally {
      setLoading(false);
    }
  };

  const getPapersByStatus = (status: Status) =>
    papers.filter((p) => p.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activePaper = papers.find((p) => p.id === activeId);
    if (!activePaper) return;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);

    if (isOverColumn) {
      const newStatus = overId as Status;
      if (activePaper.status !== newStatus) {
        setPapers((prev) =>
          prev.map((p) =>
            p.id === activeId ? { ...p, status: newStatus } : p
          )
        );
      }
    } else {
      const overPaper = papers.find((p) => p.id === overId);
      if (overPaper && activePaper.status !== overPaper.status) {
        setPapers((prev) =>
          prev.map((p) =>
            p.id === activeId ? { ...p, status: overPaper.status } : p
          )
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activePaper = papers.find((p) => p.id === activeId);
    if (!activePaper) return;

    let newStatus: Status | undefined;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    if (isOverColumn) {
      newStatus = overId as Status;
    } else {
      const overPaper = papers.find((p) => p.id === overId);
      if (overPaper) {
        newStatus = overPaper.status;
      }
    }

    if (newStatus && newStatus !== activePaper.status) {
      try {
        const res = await fetch(`/api/papers/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Failed to update");
        toast.success(`Moved to ${newStatus.replace("_", " ")}`);
      } catch (error) {
        console.error("Failed to update status:", error);
        toast.error("Failed to update status");
        fetchPapers();
      }
    }

    if (!isOverColumn && overId !== activeId) {
      const overPaper = papers.find((p) => p.id === overId);
      if (overPaper && activePaper.status === overPaper.status) {
        const statusPapers = getPapersByStatus(activePaper.status);
        const oldIndex = statusPapers.findIndex((p) => p.id === activeId);
        const newIndex = statusPapers.findIndex((p) => p.id === overId);

        if (oldIndex !== newIndex) {
          const reordered = arrayMove(statusPapers, oldIndex, newIndex);
          setPapers((prev) => {
            const otherPapers = prev.filter((p) => p.status !== activePaper.status);
            return [...otherPapers, ...reordered];
          });
        }
      }
    }
  };

  const activePaper = activeId ? papers.find((p) => p.id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reading List</h1>
          <p className="text-muted-foreground">Drag and drop to organize</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reading List</h1>
        <p className="text-muted-foreground">
          {papers.length} papers in your reading list
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnPapers = getPapersByStatus(column.id);
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                count={columnPapers.length}
              >
                <SortableContext
                  items={columnPapers.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnPapers.map((paper) => (
                    <KanbanCard key={paper.id} paper={paper} />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activePaper && <KanbanCard paper={activePaper} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

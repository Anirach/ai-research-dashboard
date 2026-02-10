"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-muted/50 p-4 min-h-[500px] transition-colors",
        isOver && "bg-muted ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

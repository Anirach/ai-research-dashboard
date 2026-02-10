"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      if (res.status === 409) {
        toast.error("Tag already exists");
        return;
      }

      if (!res.ok) throw new Error("Failed to create tag");

      const tag = await res.json();
      setTags([...tags, tag]);
      onChange([...selectedIds, tag.id]);
      setNewTagName("");
      toast.success("Tag created");
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            style={{ borderColor: tag.color, color: tag.color }}
            className="pr-1"
          >
            {tag.name}
            <button
              onClick={() => toggleTag(tag.id)}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="font-medium text-sm">Select or create tags</div>

            {tags.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tags.map((tag) => {
                  const isSelected = selectedIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t pt-3 space-y-2">
              <Input
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-1">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      newTagColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button
                size="sm"
                onClick={createTag}
                disabled={!newTagName.trim() || creating}
                className="w-full"
              >
                {creating ? "Creating..." : "Create Tag"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

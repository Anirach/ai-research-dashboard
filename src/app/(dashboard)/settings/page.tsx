"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { papers: number };
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tags, setTags] = useState<Tag[]>([]);
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

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!res.ok) throw new Error("Failed to create");
      toast.success("Tag created");
      setNewTagName("");
      fetchTags();
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const deleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Tag deleted");
      fetchTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-lg">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session?.user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Manage your paper tags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createTag} className="flex gap-2">
            <Input
              placeholder="New tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`h-9 w-9 rounded transition-transform ${
                    newTagColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button type="submit" disabled={!newTagName.trim() || creating}>
              {creating ? "Creating..." : "Add"}
            </Button>
          </form>

          <Separator />

          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags created yet</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium">{tag.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tag._count.papers} papers
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTag(tag.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

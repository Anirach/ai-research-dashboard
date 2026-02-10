import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { TodaysPapers } from "@/components/dashboard/todays-papers";

async function getStats(userId: string) {
  const [total, toRead, reading, done, recentPapers] = await Promise.all([
    prisma.paper.count({ where: { userId } }),
    prisma.paper.count({ where: { userId, status: "TO_READ" } }),
    prisma.paper.count({ where: { userId, status: "READING" } }),
    prisma.paper.count({ where: { userId, status: "DONE" } }),
    prisma.paper.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        tags: { include: { tag: true } },
      },
    }),
  ]);

  return { total, toRead, reading, done, recentPapers };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats(session!.user.id);

  const statCards = [
    {
      title: "Total Papers",
      value: stats.total,
      icon: FileText,
      description: "In your library",
    },
    {
      title: "To Read",
      value: stats.toRead,
      icon: Clock,
      description: "Papers in queue",
    },
    {
      title: "Reading",
      value: stats.reading,
      icon: BookOpen,
      description: "Currently reading",
    },
    {
      title: "Completed",
      value: stats.done,
      icon: CheckCircle,
      description: "Finished reading",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "Researcher"}!
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recently updated papers</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentPapers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No papers yet.{" "}
                <Link href="/search" className="text-primary hover:underline">
                  Search for papers
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentPapers.map((paper) => (
                  <Link
                    key={paper.id}
                    href={`/papers/${paper.id}`}
                    className="block rounded-lg border p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {paper.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(paper.updatedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          paper.status === "DONE"
                            ? "default"
                            : paper.status === "READING"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {paper.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {paper.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {paper.tags.slice(0, 3).map(({ tag }) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            style={{
                              borderColor: tag.color,
                              color: tag.color,
                            }}
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TodaysPapers />
      </div>
    </div>
  );
}

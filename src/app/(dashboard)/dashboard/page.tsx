import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, CheckCircle, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { TodaysPapers } from "@/components/dashboard/todays-papers";
import { Button } from "@/components/ui/button";

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
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "To Read",
      value: stats.toRead,
      icon: Clock,
      description: "Papers in queue",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: "Reading",
      value: stats.reading,
      icon: BookOpen,
      description: "Currently reading",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Completed",
      value: stats.done,
      icon: CheckCircle,
      description: "Finished reading",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, <span className="text-gradient">{session?.user?.name?.split(' ')[0] || "Researcher"}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your research today.
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/search" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Find Papers
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bgColor}`} />
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Your recently updated papers</CardDescription>
            </div>
            {stats.recentPapers.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/papers" className="gap-1 text-xs">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {stats.recentPapers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No papers yet. Start building your library!
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/search">Search for papers</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPapers.map((paper) => (
                  <Link
                    key={paper.id}
                    href={`/papers/${paper.id}`}
                    className="block rounded-xl border bg-card p-3.5 hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
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
                        className="shrink-0"
                      >
                        {paper.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {paper.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {paper.tags.slice(0, 3).map(({ tag }) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            style={{
                              borderColor: tag.color,
                              color: tag.color,
                              backgroundColor: `${tag.color}10`,
                            }}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {paper.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{paper.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Papers */}
        <TodaysPapers />
      </div>
    </div>
  );
}

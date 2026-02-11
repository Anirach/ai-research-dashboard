"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Sparkles, BookOpen, Network, Search } from "lucide-react";
import { ThemeToggleMinimal } from "@/components/ui/theme-toggle";

export default function SignInPage() {
  const features = [
    { icon: BookOpen, text: "Track your reading progress" },
    { icon: Search, text: "Search arXiv papers" },
    { icon: Network, text: "Visualize citations" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      {/* Theme toggle in corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggleMinimal />
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-chart-3/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl shadow-primary/10 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">AI Research Dashboard</CardTitle>
          <CardDescription className="text-sm mt-2">
            Your personal research assistant for tracking arXiv papers, 
            managing reading lists, and exploring citation networks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Features */}
          <div className="grid gap-3">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Sign in button */}
          <Button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/25"
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>

          <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            Your data is stored securely and never shared.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

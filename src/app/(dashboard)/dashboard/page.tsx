"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import { Globe, Plus, ArrowRight, Link2, AlertTriangle } from "lucide-react";

interface Site {
  id: string;
  name: string;
  url: string;
  lastSyncAt: string | null;
  googleConnection: { id: string; googleEmail: string } | null;
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGoogleConnection, setHasGoogleConnection] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sites");
        const data = await res.json();
        setSites(data.sites || []);
        setHasGoogleConnection(
          data.sites?.some((s: Site) => s.googleConnection) || false
        );
      } catch (e) {
        console.error("Failed to load sites:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Empty state: no sites yet
  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome! Let&apos;s get your first site set up.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Step 1: Connect Google */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  1
                </div>
                <CardTitle className="text-lg">Connect Google</CardTitle>
              </div>
              <CardDescription>
                Link your Google Analytics and Search Console to fetch SEO data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/api/google/connect">
                <Button>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Google Account
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 2: Add Site */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  2
                </div>
                <CardTitle className="text-lg">Add Your Site</CardTitle>
              </div>
              <CardDescription>
                Add your website and connect it to GA4 and Search Console.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sites?new=true">
                <Button variant={hasGoogleConnection ? "default" : "secondary"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Site
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your sites&apos; SEO performance
          </p>
        </div>
        <Link href="/sites?new=true">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </Link>
      </div>

      {/* Sites overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Link key={site.id} href={`/sites/${site.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{site.name}</CardTitle>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription className="truncate text-xs">
                  {site.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {site.googleConnection ? (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Connected
                    {site.lastSyncAt && (
                      <span className="text-muted-foreground">
                        · Last sync: {new Date(site.lastSyncAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-yellow-600">
                    <AlertTriangle className="h-3 w-3" />
                    Google not connected
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

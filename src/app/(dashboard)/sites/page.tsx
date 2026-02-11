"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Plus, Trash2, ArrowRight } from "lucide-react";

interface Site {
  id: string;
  name: string;
  url: string;
  ga4PropertyId: string | null;
  gscSiteUrl: string | null;
  lastSyncAt: string | null;
  googleConnection: { id: string; googleEmail: string } | null;
}

interface GA4Property {
  id: string;
  name: string;
  account: string;
}

interface GSCSite {
  siteUrl: string;
  permissionLevel: string | null;
}

export default function SitesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <SitesContent />
    </Suspense>
  );
}

function SitesContent() {
  const searchParams = useSearchParams();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(searchParams.get("new") === "true");

  // New site form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [gscSites, setGscSites] = useState<GSCSite[]>([]);
  const [saving, setSaving] = useState(false);
  const [connections, setConnections] = useState<{ id: string; googleEmail: string }[]>([]);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      setSites(data.sites || []);
      const conns = (data.sites || [])
        .map((s: Site) => s.googleConnection)
        .filter(Boolean)
        .filter(
          (c: { id: string }, i: number, arr: { id: string }[]) =>
            arr.findIndex((x) => x.id === c.id) === i
        );
      setConnections(conns);
    } catch (e) {
      console.error("Failed to load sites:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadProperties(connId: string) {
    try {
      const res = await fetch(`/api/google/properties?connectionId=${connId}`);
      const data = await res.json();
      setProperties(data.properties || []);
      setGscSites(data.gscSites || []);
    } catch (e) {
      console.error("Failed to load properties:", e);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url,
          googleConnectionId: connectionId || undefined,
          ga4PropertyId: ga4PropertyId || undefined,
          gscSiteUrl: gscSiteUrl || undefined,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        setName("");
        setUrl("");
        setConnectionId("");
        setGa4PropertyId("");
        setGscSiteUrl("");
        loadSites();
      }
    } catch (e) {
      console.error("Failed to create site:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(siteId: string) {
    if (!confirm("Are you sure you want to delete this site?")) return;
    await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
    loadSites();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-muted-foreground">Manage your monitored websites</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add a new site</DialogTitle>
              <DialogDescription>
                Enter your website details and connect Google services.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site name</Label>
                <Input
                  id="site-name"
                  placeholder="My Business"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-url">Website URL</Label>
                <Input
                  id="site-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              {connections.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Google Connection</Label>
                    <Select
                      value={connectionId}
                      onValueChange={(val) => {
                        setConnectionId(val);
                        loadProperties(val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Google account" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.googleEmail}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {properties.length > 0 && (
                    <div className="space-y-2">
                      <Label>GA4 Property</Label>
                      <Select value={ga4PropertyId} onValueChange={setGa4PropertyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GA4 property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.account})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {gscSites.length > 0 && (
                    <div className="space-y-2">
                      <Label>Search Console Site</Label>
                      <Select value={gscSiteUrl} onValueChange={setGscSiteUrl}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Search Console site" />
                        </SelectTrigger>
                        <SelectContent>
                          {gscSites.map((s) => (
                            <SelectItem key={s.siteUrl} value={s.siteUrl}>
                              {s.siteUrl}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {connections.length === 0 && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
                  <Link href="/api/google/connect" className="underline">
                    Connect your Google account
                  </Link>{" "}
                  first to link GA4 and Search Console.
                </div>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Adding..." : "Add Site"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No sites yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first website to start monitoring its SEO.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{site.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={() => handleDelete(site.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="truncate text-xs">
                  {site.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex gap-2">
                  {site.ga4PropertyId && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      GA4
                    </span>
                  )}
                  {site.gscSiteUrl && (
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      GSC
                    </span>
                  )}
                  {!site.ga4PropertyId && !site.gscSiteUrl && (
                    <span className="text-xs text-muted-foreground">
                      No data sources connected
                    </span>
                  )}
                </div>
                <Link href={`/sites/${site.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

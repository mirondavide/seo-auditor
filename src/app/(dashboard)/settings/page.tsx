"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Upload, Trash2 } from "lucide-react";
import Link from "next/link";
import type { PlanTier } from "@/types";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/billing/plan");
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
        }
      } catch {}
    }
    fetchPlan();
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
      }
    } catch (err) {
      console.error("Logo upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoRemove() {
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (res.ok) {
        setLogoUrl(null);
      }
    } catch (err) {
      console.error("Logo remove error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={session?.user?.name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session?.user?.email || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Connection</CardTitle>
          <CardDescription>
            Connect your Google account to access Analytics and Search Console data.
            This is separate from your login — it grants read-only access to your SEO data.
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

      {plan === "agency" && (
        <Card>
          <CardHeader>
            <CardTitle>White-Label Branding</CardTitle>
            <CardDescription>
              Upload your logo for white-label PDF reports. Your logo will replace the
              SEO Auditor branding on all generated reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Brand logo"
                  className="h-12 max-w-[200px] object-contain rounded border p-1"
                />
                <Button variant="outline" size="sm" onClick={handleLogoRemove}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload your logo</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, or SVG. Max 2 MB.</p>
                    </div>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Contact support to delete your account and all associated data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

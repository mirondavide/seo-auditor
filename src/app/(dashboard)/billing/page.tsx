"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Building2 } from "lucide-react";
import type { PlanTier } from "@/types";

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/billing/plan");
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
        }
      } catch {} finally {
        setCheckingPlan(false);
      }
    }
    fetchPlan();
  }, []);

  async function handleCheckout(tier: "pro" | "agency") {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Checkout error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Portal error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (checkingPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription</p>
      </div>

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-700">
          Your subscription is now active!
        </div>
      )}
      {canceled && (
        <div className="rounded-md bg-yellow-50 p-4 text-yellow-700">
          Checkout was canceled. You can try again anytime.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Free Plan */}
        <Card className={plan === "free" ? "border-blue-200" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Free</CardTitle>
              {plan === "free" && <Badge variant="secondary">Current Plan</Badge>}
            </div>
            <div className="text-3xl font-bold">
              0 EUR<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <CardDescription>For getting started with SEO monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "1 website",
                "3 audits per month",
                "Basic metrics dashboard",
                "Top search queries",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
              {[
                "PDF reports",
                "Email alerts",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                  <Check className="h-4 w-4 text-gray-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={plan === "pro" ? "border-blue-500 shadow-lg" : "border-blue-200"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Pro</CardTitle>
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              {plan === "pro" ? (
                <Badge>Active</Badge>
              ) : (
                <Badge variant="outline" className="border-blue-200 text-blue-600">Most Popular</Badge>
              )}
            </div>
            <div className="text-3xl font-bold">
              19 EUR<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <CardDescription>Full SEO monitoring for growing businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "5 websites",
                "Unlimited audits",
                "Full metrics dashboard",
                "Top search queries",
                "PDF reports with recommendations",
                "Monthly email alerts",
                "Regression detection",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan === "pro" ? (
                <Button variant="outline" className="w-full" onClick={handlePortal} disabled={loading}>
                  Manage Subscription
                </Button>
              ) : plan === "agency" ? (
                <Button variant="outline" className="w-full" onClick={handlePortal} disabled={loading}>
                  Switch Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleCheckout("pro")} disabled={loading}>
                  {loading ? "Loading..." : "Upgrade to Pro"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agency Plan */}
        <Card className={plan === "agency" ? "border-purple-500 shadow-lg" : "border-purple-200"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Agency</CardTitle>
                <Building2 className="h-4 w-4 text-purple-500" />
              </div>
              {plan === "agency" && <Badge className="bg-purple-600">Active</Badge>}
            </div>
            <div className="text-3xl font-bold">
              49 EUR<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <CardDescription>For agencies managing multiple clients</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "20 websites",
                "Unlimited audits",
                "Full metrics dashboard",
                "Top search queries",
                "White-label PDF reports",
                "Monthly email alerts",
                "Regression detection",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan === "agency" ? (
                <Button variant="outline" className="w-full" onClick={handlePortal} disabled={loading}>
                  Manage Subscription
                </Button>
              ) : plan === "pro" ? (
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleCheckout("agency")} disabled={loading}>
                  {loading ? "Loading..." : "Upgrade to Agency"}
                </Button>
              ) : (
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleCheckout("agency")} disabled={loading}>
                  {loading ? "Loading..." : "Upgrade to Agency"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/audit/rate-limit";
import { runPublicAudit } from "@/lib/audit/public-audit";

const bodySchema = z.object({
  url: z.string().url().refine(
    (val) => val.startsWith("http://") || val.startsWith("https://"),
    { message: "URL must start with http:// or https://" }
  ),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const { allowed, remaining, resetAt } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", resetAt },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetAt),
          },
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL. Please enter a valid website address.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await runPublicAudit(parsed.data.url);

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetAt),
      },
    });
  } catch (error) {
    console.error("Public audit error:", error);

    if (
      error instanceof Error &&
      (error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("abort"))
    ) {
      return NextResponse.json(
        { error: "Could not reach the website. Please check the URL and try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

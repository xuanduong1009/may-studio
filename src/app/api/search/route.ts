import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestions } from "@/lib/queries";

/** Instant search used by the Ctrl+K palette. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 1) return NextResponse.json({ products: [], categories: [], total: 0 });
  const result = await searchSuggestions(q);
  return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

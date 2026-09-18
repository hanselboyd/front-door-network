import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const shelfCount = await db.shelf.count();
    return NextResponse.json({
      ok: true,
      service: "front-door-network",
      version: "v2",
      database: "connected",
      shelfCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({
      ok: true,
      service: "front-door-network",
      version: "v2",
      database: "unavailable",
      error: message.replace(/postgresql:\/\/[^\s]+/gi, "[DATABASE_URL REDACTED]")
    });
  }
}

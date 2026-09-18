import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const shelves = await db.shelf.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });
    return NextResponse.json(shelves);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin shelves error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

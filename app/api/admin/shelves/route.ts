import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function authorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shelves = await db.shelf.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(shelves);
}

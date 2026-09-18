import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRokuItem } from "@/lib/roku";

export const dynamic = "force-dynamic";

export async function GET() {
  const shelves = await db.shelf.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      placements: {
        orderBy: { sortOrder: "asc" },
        where: { film: { status: "PUBLISHED", rokuEnabled: true } },
        include: { film: { include: { creator: true } } },
      },
    },
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    shelves: shelves.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      items: s.placements.map((p) => toRokuItem(p.film)),
    })),
  });
}

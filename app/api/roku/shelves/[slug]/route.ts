import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRokuItem } from "@/lib/roku";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shelf = await db.shelf.findUnique({
    where: { slug },
    include: {
      placements: {
        orderBy: { sortOrder: "asc" },
        where: { film: { status: "PUBLISHED", rokuEnabled: true } },
        include: { film: { include: { creator: true } } },
      },
    },
  });
  if (!shelf) return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  return NextResponse.json({
    id: shelf.id,
    name: shelf.name,
    slug: shelf.slug,
    description: shelf.description,
    items: shelf.placements.map((p) => toRokuItem(p.film)),
  });
}

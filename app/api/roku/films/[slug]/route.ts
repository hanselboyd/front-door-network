import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRokuItem } from "@/lib/roku";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = await db.film.findUnique({ where: { slug }, include: { creator: true } });
  if (!film || film.status !== "PUBLISHED" || !film.rokuEnabled) {
    return NextResponse.json({ error: "Film not found" }, { status: 404 });
  }
  return NextResponse.json(toRokuItem(film));
}

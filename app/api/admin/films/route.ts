import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const FilmInput = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  synopsis: z.string().min(1),
  creatorName: z.string().optional(),
  creatorSlug: z.string().optional(),
  genre: z.string().optional(),
  releaseYear: z.number().int().optional(),
  runtimeSeconds: z.number().int().positive().optional(),
  rating: z.string().optional(),
  posterUrl: z.string().url().optional(),
  landscapeUrl: z.string().url().optional(),
  trailerUrl: z.string().url().optional(),
  bunnyVideoId: z.string().optional(),
  bunnyPlaybackUrl: z.string().url().optional(),
  captionsUrl: z.string().url().optional(),
  aiTools: z.array(z.string()).default([]),
  acnFilmId: z.string().optional(),
  shelfSlugs: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  rokuEnabled: z.boolean().default(false),
  publish: z.boolean().default(false),
});

function authorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const films = await db.film.findMany({
      orderBy: { createdAt: "desc" },
      include: { shelfPlacements: { include: { shelf: true }, orderBy: { sortOrder: "asc" } }, creator: true },
    });
    return NextResponse.json(films);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin films error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = FilmInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const creator = data.creatorName && data.creatorSlug
    ? await db.creator.upsert({
        where: { slug: data.creatorSlug },
        update: { name: data.creatorName },
        create: { name: data.creatorName, slug: data.creatorSlug },
      })
    : null;

  const shelves = data.shelfSlugs.length
    ? await db.shelf.findMany({ where: { slug: { in: data.shelfSlugs } } })
    : [];

  const film = await db.film.create({
    data: {
      title: data.title,
      slug: data.slug,
      synopsis: data.synopsis,
      creatorId: creator?.id,
      genre: data.genre,
      releaseYear: data.releaseYear,
      runtimeSeconds: data.runtimeSeconds,
      rating: data.rating,
      posterUrl: data.posterUrl,
      landscapeUrl: data.landscapeUrl,
      trailerUrl: data.trailerUrl,
      bunnyVideoId: data.bunnyVideoId,
      bunnyPlaybackUrl: data.bunnyPlaybackUrl,
      captionsUrl: data.captionsUrl,
      aiTools: data.aiTools,
      acnFilmId: data.acnFilmId,
      featured: data.featured,
      rokuEnabled: data.rokuEnabled,
      status: data.publish ? "PUBLISHED" : "DRAFT",
      shelfPlacements: { create: shelves.map((s, index) => ({ shelfId: s.id, sortOrder: index * 10 })) },
    },
    include: { creator: true, shelfPlacements: { include: { shelf: true } } },
  });

  return NextResponse.json(film, { status: 201 });
}

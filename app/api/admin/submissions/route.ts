import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

function authorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await db.submission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      creatorName: true,
      email: true,
      filmTitle: true,
      synopsis: true,
      filmUrl: true,
      trailerUrl: true,
      websiteUrl: true,
      socialUrl: true,
      acnFilmId: true,
      aiTools: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(submissions);
}

const UpdateInput = z.object({
  status: z.enum(["NEW", "REVIEWING", "ACCEPTED", "DECLINED"]).optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function PATCH(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Submission id is required." }, { status: 400 });

    const parsed = UpdateInput.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid submission update." }, { status: 400 });

    const updated = await db.submission.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update submission." }, { status: 500 });
  }
}

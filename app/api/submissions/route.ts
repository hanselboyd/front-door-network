import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const SubmissionInput = z.object({
  creatorName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  filmTitle: z.string().min(1).max(180),
  synopsis: z.string().min(20).max(4000),
  filmUrl: z.string().url().max(1000),
  trailerUrl: z.string().url().max(1000).optional(),
  websiteUrl: z.string().url().max(1000).optional(),
  socialUrl: z.string().url().max(1000).optional(),
  acnFilmId: z.string().max(120).optional(),
  aiTools: z.array(z.string().max(80)).max(30).default([]),
  rightsConfirmed: z.literal(true),
  aiNativeConfirmed: z.literal(true),
  company: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = SubmissionInput.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please complete the required fields correctly.", details: parsed.error.flatten() }, { status: 400 });
    }

    const { company, ...data } = parsed.data;
    if (company) return NextResponse.json({ success: true }, { status: 201 });

    const normalizedEmail = data.email.trim().toLowerCase();
    const account = await db.creatorAccount.findUnique({ where: { email: normalizedEmail } });

    const submission = await db.submission.create({
      data: {
        ...data,
        email: normalizedEmail,
        creatorAccountId: account?.id || null,
        trailerUrl: data.trailerUrl || null,
        websiteUrl: data.websiteUrl || null,
        socialUrl: data.socialUrl || null,
        acnFilmId: data.acnFilmId || null,
      },
      select: { id: true, filmTitle: true, status: true, createdAt: true },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit film.";
    console.error("POST /api/submissions failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

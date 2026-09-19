import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { claimExistingSubmissions, createCreatorSession, hashPassword, normalizeEmail } from "@/lib/creator-auth";

const Input = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter your name, valid email, and a password of at least 8 characters." }, { status: 400 });

    const email = normalizeEmail(parsed.data.email);
    const existing = await db.creatorAccount.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "An account already exists for this email. Sign in instead." }, { status: 409 });

    const account = await db.creatorAccount.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash: hashPassword(parsed.data.password),
      },
      select: { id: true, name: true, email: true },
    });

    await claimExistingSubmissions(account.id, email);
    await createCreatorSession(account.id);

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Creator register failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create creator account." }, { status: 500 });
  }
}

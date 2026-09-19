import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { claimExistingSubmissions, createCreatorSession, normalizeEmail, verifyPassword } from "@/lib/creator-auth";

const Input = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });

    const email = normalizeEmail(parsed.data.email);
    const account = await db.creatorAccount.findUnique({ where: { email } });

    if (!account || !verifyPassword(parsed.data.password, account.passwordHash)) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await claimExistingSubmissions(account.id, email);
    await createCreatorSession(account.id);

    return NextResponse.json({ account: { id: account.id, name: account.name, email: account.email } });
  } catch (error) {
    console.error("Creator login failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 500 });
  }
}

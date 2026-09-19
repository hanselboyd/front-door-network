import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCreatorAccount } from "@/lib/creator-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCreatorAccount();
  if (!account) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const submissions = await db.submission.findMany({
    where: { creatorAccountId: account.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filmTitle: true,
      synopsis: true,
      filmUrl: true,
      trailerUrl: true,
      acnFilmId: true,
      aiTools: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    account: { id: account.id, name: account.name, email: account.email },
    submissions,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const Input = z.object({
  name: z.string().min(2).max(120),
  company: z.string().min(2).max(160),
  email: z.string().email().max(200),
  websiteUrl: z.string().url().max(1000).optional(),
  budget: z.string().max(120).optional(),
  interest: z.string().min(2).max(200),
  message: z.string().max(4000).optional(),
  organization: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please complete the required sponsor fields correctly." }, { status: 400 });
    }

    const { organization, ...data } = parsed.data;
    if (organization) return NextResponse.json({ success: true }, { status: 201 });

    const inquiry = await db.sponsorInquiry.create({
      data: {
        ...data,
        websiteUrl: data.websiteUrl || null,
        budget: data.budget || null,
        message: data.message || null,
      },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error) {
    console.error("Sponsor inquiry failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit sponsor inquiry." }, { status: 500 });
  }
}

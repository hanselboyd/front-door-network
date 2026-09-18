import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

function config() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libraryId || !apiKey) throw new Error("Bunny Stream is not fully configured.");
  return { libraryId, apiKey };
}

export async function PUT(req: Request, context: { params: Promise<{ guid: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { guid } = await context.params;
    if (!guid) return NextResponse.json({ error: "Bunny video ID is required." }, { status: 400 });
    if (!req.body) return NextResponse.json({ error: "Video file body is required." }, { status: 400 });

    const { libraryId, apiKey } = config();

    const init: RequestInit & { duplex?: "half" } = {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
      },
      body: req.body,
      duplex: "half",
      cache: "no-store",
    };

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, init);
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || data?.Message || text || `Bunny upload returned HTTP ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload video to Bunny." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

function config() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const hostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;
  if (!libraryId || !apiKey || !hostname) throw new Error("Bunny Stream is not fully configured.");
  return { libraryId, apiKey, hostname: hostname.replace(/^https?:\/\//, "").replace(/\/$/, "") };
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { libraryId, apiKey, hostname } = config();
    const body = await req.json();
    const url = String(body?.url || "").trim();
    const title = String(body?.title || "").trim();

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "A public HTTP/HTTPS source URL is required." }, { status: 400 });
    }

    const payload: Record<string, string> = { url };
    if (title) payload.title = title;

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/fetch`, {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || data?.Message || text || `Bunny fetch returned HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const guid = data?.guid || data?.videoId || null;
    return NextResponse.json({
      ...data,
      guid,
      playbackUrl: guid ? `https://${hostname}/${guid}/playlist.m3u8` : null,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import video into Bunny." },
      { status: 500 }
    );
  }
}

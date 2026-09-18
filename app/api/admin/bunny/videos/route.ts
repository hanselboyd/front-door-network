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
  if (!libraryId || !apiKey || !hostname) {
    throw new Error("Bunny Stream is not fully configured in Railway variables.");
  }
  return { libraryId, apiKey, hostname: hostname.replace(/^https?:\/\//, "").replace(/\/$/, "") };
}

function normalizeVideo(video: any, hostname: string) {
  const guid = video.guid;
  return {
    guid,
    title: video.title,
    status: video.status,
    encodeProgress: video.encodeProgress,
    length: video.length,
    width: video.width,
    height: video.height,
    availableResolutions: video.availableResolutions,
    thumbnailFileName: video.thumbnailFileName,
    captions: video.captions || [],
    playbackUrl: guid ? `https://${hostname}/${guid}/playlist.m3u8` : null,
    thumbnailUrl: guid && video.thumbnailFileName ? `https://${hostname}/${guid}/${video.thumbnailFileName}` : null,
  };
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { libraryId, apiKey, hostname } = config();
    const url = new URL(`https://video.bunnycdn.com/library/${libraryId}/videos`);
    url.searchParams.set("page", "1");
    url.searchParams.set("itemsPerPage", "100");

    const res = await fetch(url, {
      headers: { AccessKey: apiKey, Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { error: body?.message || body?.Message || text || `Bunny API returned HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    return NextResponse.json({
      connected: true,
      libraryId,
      count: items.length,
      items: items.map((video: any) => normalizeVideo(video, hostname)),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown Bunny configuration error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { libraryId, apiKey, hostname } = config();
    const payload = await req.json();
    const title = String(payload?.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ title }),
      cache: "no-store",
    });

    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { error: body?.message || body?.Message || text || `Bunny API returned HTTP ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(normalizeVideo(body, hostname), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown Bunny create error" },
      { status: 500 }
    );
  }
}

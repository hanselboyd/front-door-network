import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function runtime(seconds?: number | null) {
  return seconds ? `${Math.max(1, Math.round(seconds / 60))} min` : null;
}

export default async function WatchPage() {
  const films = await db.film.findMany({
    where: { status: "PUBLISHED", rokuEnabled: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    include: { creator: true, shelfPlacements: { include: { shelf: true } } },
  });

  return <div className="wrap">
    <nav className="nav">
      <a className="brand" href="/">FRONT DOOR</a>
      <div className="navlinks"><a href="/watch">WATCH</a><a href="/">NETWORK</a></div>
    </nav>
    <main className="watchPage">
      <div className="pageIntro">
        <div className="eyebrow">ON DEMAND</div>
        <h1>WATCH FRONT DOOR</h1>
        <p>AI-native cinema programmed for Front Door Network.</p>
      </div>
      <div className="filmGrid filmGridWide">
        {films.map((f) => <a className="filmCard" href={`/films/${f.slug}`} key={f.id}>
          <div className="filmArt" style={f.posterUrl ? { backgroundImage: `url("${f.posterUrl}")` } : undefined}>
            {!f.posterUrl && <span>FRONT DOOR</span>}
            <div className="playBadge">▶</div>
          </div>
          <div className="filmCardBody">
            <strong>{f.title}</strong>
            <small>{[f.releaseYear, f.genre, runtime(f.runtimeSeconds), f.rating].filter(Boolean).join(" · ")}</small>
            <p>{f.creator?.name || "Front Door Network"}</p>
            <div className="cardShelves">{f.shelfPlacements.map(p => p.shelf.name).join(" · ")}</div>
          </div>
        </a>)}
      </div>
    </main>
    <footer className="footer">FRONT DOOR NETWORK · AI CINEMA ON DEMAND</footer>
  </div>;
}

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatRuntime(seconds?: number | null) {
  if (!seconds) return null;
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

export default async function Home() {
  let shelves: any[] = [];
  try {
    shelves = await db.shelf.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        placements: {
          orderBy: { sortOrder: "asc" },
          where: { film: { status: "PUBLISHED", rokuEnabled: true } },
          include: { film: { include: { creator: true } } },
        },
      },
    });
  } catch {}

  const liveFilms = shelves.flatMap((s) => s.placements.map((p: any) => p.film));
  const featured = liveFilms.find((f: any) => f.featured) || liveFilms[0] || null;

  return <div className="wrap">
    <nav className="nav">
      <a className="brand" href="/">FRONT DOOR</a>
      <div className="navlinks">
        <a href="/watch">WATCH</a>
        <a href="#shelves">FILMS</a>
        <a href="#creators">CREATORS</a>
        <a href="#submit">SUBMIT</a>
        <a href="#about">ABOUT</a>
      </div>
    </nav>

    <main>
      <section className="viewerHero" style={featured?.landscapeUrl || featured?.posterUrl ? {
        backgroundImage: `linear-gradient(90deg,rgba(5,5,5,.98) 0%,rgba(5,5,5,.83) 42%,rgba(5,5,5,.28) 100%),url("${featured.landscapeUrl || featured.posterUrl}")`
      } : undefined}>
        <div className="viewerHeroCopy">
          <div className="eyebrow">AI-NATIVE BROADCAST NETWORK</div>
          <h1>{featured ? featured.title : "THE FRONT DOOR TO AI CINEMA."}</h1>
          <p>{featured?.synopsis || "Original films. New filmmakers. A curated network built for the age of artificial intelligence—on the web and on Roku."}</p>
          {featured && <div className="metaLine">
            {featured.releaseYear && <span>{featured.releaseYear}</span>}
            {featured.genre && <span>{featured.genre}</span>}
            {formatRuntime(featured.runtimeSeconds) && <span>{formatRuntime(featured.runtimeSeconds)}</span>}
            {featured.rating && <span>{featured.rating}</span>}
          </div>}
          <div className="heroActions">
            {featured ? <a className="btn" href={`/films/${featured.slug}`}>WATCH NOW →</a> : <a className="btn" href="#shelves">EXPLORE THE NETWORK →</a>}
            <a className="ghostBtn" href="/watch">VIEW ALL TITLES</a>
          </div>
        </div>
      </section>

      <section className="networkStrip">
        <div><strong>{liveFilms.length}</strong><span>LIVE TITLES</span></div>
        <div><strong>{shelves.length || 6}</strong><span>PROGRAMMED SHELVES</span></div>
        <div><strong>ROKU</strong><span>+ WEB DISTRIBUTION</span></div>
        <div><strong>AI-NATIVE</strong><span>CURATED CINEMA</span></div>
      </section>

      <section className="section" id="shelves">
        <div className="sectionHead"><h2>Now Broadcasting</h2><span>Curated AI cinema</span></div>
        <div className="broadcastRows">
          {shelves.map((s) => <div className="broadcastShelf" key={s.slug}>
            <div className="shelfTitle">
              <div><span className="tag">SHELF</span><h3>{s.name}</h3></div>
              <p>{s.description}</p>
            </div>
            {s.placements.length ? <div className="filmGrid">
              {s.placements.map((p: any) => {
                const f = p.film;
                return <a className="filmCard" href={`/films/${f.slug}`} key={f.id}>
                  <div className="filmArt" style={f.posterUrl ? { backgroundImage: `url("${f.posterUrl}")` } : undefined}>
                    {!f.posterUrl && <span>FRONT DOOR</span>}
                    <div className="playBadge">▶</div>
                  </div>
                  <div className="filmCardBody">
                    <strong>{f.title}</strong>
                    <small>{[f.releaseYear, f.genre, formatRuntime(f.runtimeSeconds)].filter(Boolean).join(" · ")}</small>
                    <p>{f.creator?.name || "Front Door Network"}</p>
                  </div>
                </a>;
              })}
            </div> : <div className="emptyShelf">Programming coming soon.</div>}
          </div>)}
        </div>
      </section>

      <section className="section" id="creators">
        <div className="sectionHead"><h2>Creators First.</h2><span>Powered by the AI Cinema ecosystem</span></div>
        <p className="sectionCopy">Front Door is a curated distribution layer for AI-native filmmakers. Films connect creator identity, presentation metadata, Bunny Stream delivery and Roku programming in one network.</p>
      </section>

      <section className="section" id="submit">
        <div className="sectionHead"><h2>Bring Your Film to Front Door</h2><span>Curated distribution</span></div>
        <p className="sectionCopy">Front Door is building a selective catalog of AI-native cinema for web and Roku distribution. Submission intake will connect film metadata, creator identity, rights confirmation, artwork, captions and programming placement.</p>
      </section>
    </main>

    <footer className="footer" id="about">FRONT DOOR NETWORK · THE FRONT DOOR TO AI CINEMA</footer>
  </div>;
}

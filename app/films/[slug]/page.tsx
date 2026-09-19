import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function runtime(seconds?: number | null) {
  return seconds ? `${Math.max(1, Math.round(seconds / 60))} min` : null;
}

export default async function FilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = await db.film.findUnique({
    where: { slug },
    include: { creator: true, shelfPlacements: { include: { shelf: true } } },
  });

  if (!film || film.status !== "PUBLISHED" || !film.rokuEnabled) notFound();

  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const embedUrl = libraryId && film.bunnyVideoId
    ? `https://iframe.mediadelivery.net/embed/${libraryId}/${film.bunnyVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`
    : null;

  return <div className="filmPage">
    <nav className="nav filmNav">
      <a className="brand" href="/">FRONT DOOR</a>
      <div className="navlinks"><a href="/watch">WATCH</a><a href="/">NETWORK</a></div>
    </nav>

    <main>
      <section className="filmHero" style={film.landscapeUrl || film.posterUrl ? {
        backgroundImage: `linear-gradient(180deg,rgba(5,5,5,.25),#050505 92%),url("${film.landscapeUrl || film.posterUrl}")`
      } : undefined}>
        <div className="filmHeroInner">
          <div className="eyebrow">FRONT DOOR PRESENTS</div>
          <h1>{film.title}</h1>
          <div className="metaLine">
            {film.releaseYear && <span>{film.releaseYear}</span>}
            {film.genre && <span>{film.genre}</span>}
            {runtime(film.runtimeSeconds) && <span>{runtime(film.runtimeSeconds)}</span>}
            {film.rating && <span>{film.rating}</span>}
          </div>
        </div>
      </section>

      <section className="filmContent">
        <div className="playerShell">
          {embedUrl
            ? <iframe src={embedUrl} loading="lazy" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen title={film.title} />
            : <div className="playerUnavailable">Playback is not available for this title.</div>}
        </div>

        <div className="filmInfo">
          <div>
            <span className="tag">SYNOPSIS</span>
            <p className="filmSynopsis">{film.synopsis}</p>
          </div>
          <aside className="filmFacts">
            {film.creator?.name && <div><span>CREATOR</span><strong>{film.creator.name}</strong></div>}
            {film.genre && <div><span>GENRE</span><strong>{film.genre}</strong></div>}
            {film.aiTools.length > 0 && <div><span>AI TOOLS</span><strong>{film.aiTools.join(", ")}</strong></div>}
            {film.shelfPlacements.length > 0 && <div><span>PROGRAMMING</span><strong>{film.shelfPlacements.map(p => p.shelf.name).join(" · ")}</strong></div>}
            {film.acnFilmId && <div><span>ACN ID</span><strong>{film.acnFilmId}</strong></div>}
          </aside>
        </div>
      </section>
    </main>

    <footer className="footer filmFooter publicFooter"><a href="/watch">← BACK TO WATCH</a><a href="/sponsor">SPONSOR / PARTNER</a></footer>
  </div>;
}

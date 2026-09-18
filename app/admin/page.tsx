"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Film = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  rokuEnabled: boolean;
  featured: boolean;
  bunnyPlaybackUrl?: string | null;
  shelfPlacements: { shelf: { name: string; slug: string } }[];
};

type Shelf = { id: string; name: string; slug: string };
type BunnyVideo = {
  guid: string;
  title: string;
  status?: number;
  encodeProgress?: number;
  length?: number;
  playbackUrl?: string | null;
  thumbnailUrl?: string | null;
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [bunnyVideos, setBunnyVideos] = useState<BunnyVideo[]>([]);
  const [bunnyStatus, setBunnyStatus] = useState("Not checked");
  const [selectedBunny, setSelectedBunny] = useState("");
  const [editingFilmId, setEditingFilmId] = useState<string | null>(null);

  async function loadData(key = adminKey) {
    if (!key) return;
    setLoading(true);
    setMessage("");
    try {
      const [filmsRes, shelvesRes] = await Promise.all([
        fetch("/api/admin/films", { headers: { "x-admin-key": key }, cache: "no-store" }),
        fetch("/api/admin/shelves", { headers: { "x-admin-key": key }, cache: "no-store" }),
      ]);

      const filmsText = await filmsRes.text();
      const shelvesText = await shelvesRes.text();

      let filmsBody: any = null;
      let shelvesBody: any = null;
      try { filmsBody = filmsText ? JSON.parse(filmsText) : null; } catch {}
      try { shelvesBody = shelvesText ? JSON.parse(shelvesText) : null; } catch {}

      if (!filmsRes.ok || !shelvesRes.ok) {
        const detail =
          filmsBody?.error ||
          shelvesBody?.error ||
          filmsText ||
          shelvesText ||
          `Admin API failed (films ${filmsRes.status}, shelves ${shelvesRes.status})`;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }

      if (!Array.isArray(filmsBody) || !Array.isArray(shelvesBody)) {
        throw new Error("Admin API returned an unexpected response.");
      }

      setFilms(filmsBody);
      setShelves(shelvesBody);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load Control Room.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("frontdoor-admin-key");
    if (saved) {
      setAdminKey(saved);
      loadData(saved);
    }
  }, []);

  const publishedCount = useMemo(() => films.filter(f => f.status === "PUBLISHED" && f.rokuEnabled).length, [films]);

  async function loadBunny(key = adminKey) {
    if (!key) return;
    setBunnyStatus("Checking...");
    try {
      const res = await fetch("/api/admin/bunny/videos", {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });

      const text = await res.text();
      let body: any = null;
      if (text) {
        try { body = JSON.parse(text); } catch {
          throw new Error(`Bunny API returned non-JSON data (HTTP ${res.status}).`);
        }
      }

      if (!res.ok) throw new Error(body?.error || text || `Bunny API failed (HTTP ${res.status})`);
      if (!body) throw new Error("Bunny API returned an empty response.");
      setBunnyVideos(Array.isArray(body?.items) ? body.items : []);
      setBunnyStatus(`Connected · ${body?.count ?? 0} videos`);
    } catch (err) {
      setBunnyStatus(err instanceof Error ? err.message : "Bunny connection failed.");
    }
  }

  async function createBunnyVideo() {
    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    const title = titleInput?.value?.trim();
    if (!title) {
      setMessage("Enter a film title first, then create the Bunny video record.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bunny/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ title }),
      });

      const text = await res.text();
      let body: any = null;
      if (text) {
        try { body = JSON.parse(text); } catch {
          throw new Error(`Bunny create returned non-JSON data (HTTP ${res.status}).`);
        }
      }

      if (!res.ok) throw new Error(body?.error || text || "Unable to create Bunny video.");
      if (!body) throw new Error("Bunny create returned an empty response.");
      setMessage(`Bunny video record created for "${title}". Upload the media file in Bunny, then refresh Bunny videos here.`);
      await loadBunny();
      setSelectedBunny(body.guid || "");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create Bunny video.");
    } finally {
      setLoading(false);
    }
  }

  function applyBunnyVideo(guid: string) {
    setSelectedBunny(guid);
    const video = bunnyVideos.find(v => v.guid === guid);
    if (!video) return;
    const idInput = document.querySelector<HTMLInputElement>('input[name="bunnyVideoId"]');
    const playbackInput = document.querySelector<HTMLInputElement>('input[name="bunnyPlaybackUrl"]');
    const posterInput = document.querySelector<HTMLInputElement>('input[name="posterUrl"]');
    if (idInput) idInput.value = video.guid;
    if (playbackInput && video.playbackUrl) playbackInput.value = video.playbackUrl;
    if (posterInput && video.thumbnailUrl && !posterInput.value) posterInput.value = video.thumbnailUrl;
    setMessage(`Applied Bunny asset "${video.title}".`);
  }

  function editFilm(film: Film) {
    setEditingFilmId(film.id);
    const setVal = (name: string, value: string | number | null | undefined) => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (el) el.value = value == null ? "" : String(value);
    };
    setVal("title", film.title);
    setVal("slug", film.slug);

    const firstShelf = film.shelfPlacements.map(p => p.shelf.slug);
    shelves.forEach(s => {
      const box = document.querySelector<HTMLInputElement>(`input[name="shelf-${s.slug}"]`);
      if (box) box.checked = firstShelf.includes(s.slug);
    });

    const roku = document.querySelector<HTMLInputElement>('input[name="rokuEnabled"]');
    const featured = document.querySelector<HTMLInputElement>('input[name="featured"]');
    const publish = document.querySelector<HTMLInputElement>('input[name="publish"]');
    if (roku) roku.checked = film.rokuEnabled;
    if (featured) featured.checked = film.featured;
    if (publish) publish.checked = film.status === "PUBLISHED";

    setMessage(`Editing "${film.title}". Select the Bunny asset, update any fields, then save.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitFilm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const shelfSlugs = shelves.filter(s => form.get(`shelf-${s.slug}`) === "on").map(s => s.slug);
    const payload = {
      title: String(form.get("title") || ""),
      slug: String(form.get("slug") || ""),
      synopsis: String(form.get("synopsis") || ""),
      creatorName: String(form.get("creatorName") || "") || undefined,
      creatorSlug: String(form.get("creatorSlug") || "") || undefined,
      genre: String(form.get("genre") || "") || undefined,
      releaseYear: form.get("releaseYear") ? Number(form.get("releaseYear")) : undefined,
      runtimeSeconds: form.get("runtimeMinutes") ? Math.round(Number(form.get("runtimeMinutes")) * 60) : undefined,
      rating: String(form.get("rating") || "") || undefined,
      posterUrl: String(form.get("posterUrl") || "") || undefined,
      landscapeUrl: String(form.get("landscapeUrl") || "") || undefined,
      trailerUrl: String(form.get("trailerUrl") || "") || undefined,
      bunnyVideoId: String(form.get("bunnyVideoId") || "") || undefined,
      bunnyPlaybackUrl: String(form.get("bunnyPlaybackUrl") || "") || undefined,
      captionsUrl: String(form.get("captionsUrl") || "") || undefined,
      aiTools: String(form.get("aiTools") || "").split(",").map(v => v.trim()).filter(Boolean),
      acnFilmId: String(form.get("acnFilmId") || "") || undefined,
      shelfSlugs,
      featured: form.get("featured") === "on",
      rokuEnabled: form.get("rokuEnabled") === "on",
      publish: form.get("publish") === "on",
    };

    try {
      window.localStorage.setItem("frontdoor-admin-key", adminKey);
      const res = await fetch(editingFilmId ? `/api/admin/films?id=${editingFilmId}` : "/api/admin/films", {
        method: editingFilmId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let body: any = null;
      try { body = responseText ? JSON.parse(responseText) : null; } catch {}

      if (!res.ok) {
        const detail = body?.error || responseText || `Unable to create film (HTTP ${res.status}).`;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }

      setMessage(body?.title
        ? editingFilmId ? `Updated "${body.title}" successfully.` : `Created "${body.title}" successfully.`
        : "Film saved successfully.");
      e.currentTarget.reset();
      setEditingFilmId(null);
      setSelectedBunny("");
      await loadData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create film.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="controlRoom">
    <header className="adminHero">
      <div>
        <div className="eyebrow">FRONT DOOR CONTROL ROOM</div>
        <h1>Program the network.</h1>
        <p>Add titles, connect Bunny media, assign shelves, and publish directly into the Roku feed.</p>
      </div>
      <div className="adminStats">
        <div><span>Films</span><strong>{films.length}</strong></div>
        <div><span>Roku Live</span><strong>{publishedCount}</strong></div>
        <div><span>Shelves</span><strong>{shelves.length || 6}</strong></div>
      </div>
    </header>

    <section className="adminPanel">
      <div className="panelHead"><h2>Access</h2><span>Stored only in this browser</span></div>
      <div className="keyRow">
        <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY" />
        <button onClick={() => { window.localStorage.setItem("frontdoor-admin-key", adminKey); loadData(); loadBunny(); }} disabled={!adminKey || loading}>Connect</button>
      </div>
      {message && <div className="adminMessage">{message}</div>}
    </section>

    <section className="adminGrid">
      <form className="adminPanel filmForm" onSubmit={submitFilm}>
        <div className="panelHead"><h2>{editingFilmId ? "Edit Film" : "Add Film"}</h2><span>{editingFilmId ? "Update existing title" : "Draft or publish"}</span></div>

        <label>Title<input name="title" required /></label>
        <label>Slug<input name="slug" required placeholder="my-ai-film" pattern="[a-z0-9-]+" /></label>
        <label>Synopsis<textarea name="synopsis" required rows={4} /></label>

        <div className="formTwo">
          <label>Creator Name<input name="creatorName" /></label>
          <label>Creator Slug<input name="creatorSlug" placeholder="creator-name" /></label>
        </div>
        <div className="formThree">
          <label>Genre<input name="genre" /></label>
          <label>Release Year<input name="releaseYear" type="number" min="1900" max="2100" /></label>
          <label>Runtime (minutes)<input name="runtimeMinutes" type="number" min="1" step="0.1" /></label>
        </div>

        <div className="formTwo">
          <label>Rating<input name="rating" placeholder="NR, PG-13..." /></label>
          <label>ACN Film ID<input name="acnFilmId" /></label>
        </div>

        <section className="bunnyBox">
          <div className="panelHead"><h3>Bunny Stream</h3><span>{bunnyStatus}</span></div>
          <div className="bunnyActions">
            <button type="button" onClick={() => loadBunny()} disabled={!adminKey || loading}>Refresh Bunny</button>
            <button type="button" onClick={createBunnyVideo} disabled={!adminKey || loading}>Create Bunny Video</button>
          </div>
          <label>Existing Bunny Video
            <select value={selectedBunny} onChange={e => applyBunnyVideo(e.target.value)}>
              <option value="">Select a Bunny video...</option>
              {bunnyVideos.map(v => <option key={v.guid} value={v.guid}>
                {v.title} {typeof v.encodeProgress === "number" ? `· ${v.encodeProgress}%` : ""}
              </option>)}
            </select>
          </label>
          <p className="bunnyNote">Bunny credentials stay server-side. Selecting a video fills the Bunny ID, HLS playback URL, and thumbnail when available.</p>
        </section>

        <label>Poster URL<input name="posterUrl" type="url" placeholder="https://..." /></label>
        <label>Landscape Artwork URL<input name="landscapeUrl" type="url" placeholder="https://..." /></label>
        <label>Trailer URL<input name="trailerUrl" type="url" placeholder="https://..." /></label>

        <div className="formTwo">
          <label>Bunny Video ID<input name="bunnyVideoId" /></label>
          <label>Bunny Playback URL<input name="bunnyPlaybackUrl" type="url" placeholder="https://...m3u8" /></label>
        </div>
        <label>Captions URL<input name="captionsUrl" type="url" placeholder="https://...vtt" /></label>
        <label>AI Tools<input name="aiTools" placeholder="Runway, Veo, Kling" /></label>

        <fieldset>
          <legend>Shelf Assignment</legend>
          <div className="shelfChecks">
            {shelves.map(s => <label className="check" key={s.slug}><input type="checkbox" name={`shelf-${s.slug}`} /> {s.name}</label>)}
          </div>
        </fieldset>

        <div className="toggleRow">
          <label className="check"><input type="checkbox" name="featured" /> Featured</label>
          <label className="check"><input type="checkbox" name="rokuEnabled" /> Roku Enabled</label>
          <label className="check"><input type="checkbox" name="publish" /> Publish Now</label>
        </div>

        <div className="saveRow">
          <button className="primaryAdmin" disabled={!adminKey || loading}>{loading ? "Working..." : editingFilmId ? "Update Film" : "Save Film"}</button>
          {editingFilmId && <button type="button" className="secondaryAdmin" onClick={() => { setEditingFilmId(null); setSelectedBunny(""); setMessage("Edit cancelled."); }}>Cancel Edit</button>}
        </div>
      </form>

      <section className="adminPanel">
        <div className="panelHead"><h2>Library</h2><span>{films.length} titles</span></div>
        <div className="filmList">
          {films.length === 0 ? <p className="mutedAdmin">No films yet. Add your first title on the left.</p> : films.map(f => <article className="filmRow" key={f.id}>
            <div>
              <strong>{f.title}</strong>
              <small>{f.slug}</small>
              <div className="badges">
                <span>{f.status}</span>
                {f.rokuEnabled && <span>ROKU</span>}
                {f.featured && <span>FEATURED</span>}
              </div>
              <p>{f.shelfPlacements.map(p => p.shelf.name).join(" · ") || "No shelf assigned"}</p>
            </div>
            <div className="filmActions">
              <button type="button" onClick={() => editFilm(f)}>Edit</button>
              <a href={`/api/roku/films/${f.slug}`} target="_blank">Feed ↗</a>
            </div>
          </article>)}
        </div>
      </section>
    </section>
  </main>;
}

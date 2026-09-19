"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  creatorName: string;
  email: string;
  filmTitle: string;
  synopsis: string;
  filmUrl: string;
  trailerUrl?: string | null;
  websiteUrl?: string | null;
  socialUrl?: string | null;
  acnFilmId?: string | null;
  aiTools: string[];
  status: "NEW" | "REVIEWING" | "ACCEPTED" | "DECLINED";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminSubmissionsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [items, setItems] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(key = adminKey) {
    if (!key) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/submissions", { headers: { "x-admin-key": key }, cache: "no-store" });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(body?.error || text || "Unable to load submissions.");
      setItems(Array.isArray(body) ? body : []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("frontdoor-admin-key") || "";
    setAdminKey(saved);
    if (saved) load(saved);
  }, []);

  async function save(item: Submission) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/submissions?id=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ status: item.status, notes: item.notes || null }),
      });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(body?.error || text || "Unable to update submission.");
      setMessage(`Updated "${item.filmTitle}". Creator portal will reflect the change immediately.`);
      await load(adminKey);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update submission.");
      setLoading(false);
    }
  }

  function updateLocal(id: string, patch: Partial<Submission>) {
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  return <main className="controlRoom">
    <header className="adminHero">
      <div>
        <div className="eyebrow">FRONT DOOR CONTROL ROOM</div>
        <h1>Submission Review.</h1>
        <p>Review filmmaker intake, update status, and send notes directly into the creator portal.</p>
      </div>
      <div className="adminStats">
        <div><span>Total</span><strong>{items.length}</strong></div>
        <div><span>New</span><strong>{items.filter(i => i.status === "NEW").length}</strong></div>
        <div><span>Reviewing</span><strong>{items.filter(i => i.status === "REVIEWING").length}</strong></div>
      </div>
    </header>

    <section className="adminPanel">
      <div className="panelHead"><h2>Access</h2><span><a href="/admin">← Control Room</a></span></div>
      <div className="keyRow">
        <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY" />
        <button onClick={() => { window.localStorage.setItem("frontdoor-admin-key", adminKey); load(); }} disabled={!adminKey || loading}>Connect</button>
      </div>
      {message && <div className="adminMessage">{message}</div>}
    </section>

    <section className="reviewList">
      {items.length === 0 ? <div className="adminPanel"><p className="mutedAdmin">No submissions yet.</p></div> : items.map(item => <article className="reviewCard" key={item.id}>
        <div className="reviewCardTop">
          <div>
            <span className={"submissionStatus status-" + item.status.toLowerCase()}>{item.status}</span>
            <h2>{item.filmTitle}</h2>
            <p>{item.creatorName} · {item.email}</p>
          </div>
          <div className="reviewLinks">
            <a href={item.filmUrl} target="_blank" rel="noreferrer">FILM ↗</a>
            {item.trailerUrl && <a href={item.trailerUrl} target="_blank" rel="noreferrer">TRAILER ↗</a>}
          </div>
        </div>

        <p className="reviewSynopsis">{item.synopsis}</p>

        <div className="reviewMeta">
          {item.acnFilmId && <span>ACN · {item.acnFilmId}</span>}
          {item.aiTools.length > 0 && <span>AI TOOLS · {item.aiTools.join(", ")}</span>}
          <span>SUBMITTED · {new Date(item.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="reviewControls">
          <label>Status
            <select value={item.status} onChange={e => updateLocal(item.id, { status: e.target.value as Submission["status"] })}>
              <option value="NEW">Received</option>
              <option value="REVIEWING">In Review</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
            </select>
          </label>
          <label>Creator Note
            <textarea rows={4} value={item.notes || ""} onChange={e => updateLocal(item.id, { notes: e.target.value })} placeholder="Optional message visible in the creator portal." />
          </label>
          <button onClick={() => save(item)} disabled={loading}>SAVE STATUS</button>
        </div>
      </article>)}
    </section>
  </main>;
}

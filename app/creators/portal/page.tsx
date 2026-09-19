"use client";

import { FormEvent, useEffect, useState } from "react";

type Submission = {
  id: string;
  filmTitle: string;
  synopsis: string;
  filmUrl: string;
  trailerUrl?: string | null;
  acnFilmId?: string | null;
  aiTools: string[];
  status: "NEW" | "REVIEWING" | "ACCEPTED" | "DECLINED";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PortalData = {
  account: { id: string; name: string; email: string };
  submissions: Submission[];
};

const statusCopy: Record<Submission["status"], string> = {
  NEW: "Received",
  REVIEWING: "In Review",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export default function CreatorPortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/me", { cache: "no-store" });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch {}
      if (res.ok) setData(body);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      ...(mode === "register" ? { name: String(form.get("name") || "").trim() } : {}),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
    };

    try {
      const res = await fetch(mode === "register" ? "/api/creator/register" : "/api/creator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(body?.error || text || "Unable to continue.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to continue.");
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/creator/logout", { method: "POST" });
    setData(null);
    setMessage("");
  }

  if (loading) {
    return <div className="wrap">
      <nav className="nav"><a className="brand" href="/">FRONT DOOR</a></nav>
      <main className="portalLoading">Loading creator portal…</main>
    </div>;
  }

  if (!data) {
    return <div className="wrap">
      <nav className="nav">
        <a className="brand" href="/">FRONT DOOR</a>
        <div className="navlinks"><a href="/watch">WATCH</a><a href="/submit">SUBMIT</a></div>
      </nav>

      <main className="portalAuth">
        <section className="portalAuthCopy">
          <div className="eyebrow">CREATOR PORTAL</div>
          <h1>Track your films.</h1>
          <p>Sign in to monitor submissions, review status changes, and keep your Front Door pipeline in one place.</p>
        </section>

        <section className="portalAuthCard">
          <div className="portalTabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>SIGN IN</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>CREATE ACCOUNT</button>
          </div>

          <form onSubmit={authenticate} className="portalForm">
            {mode === "register" && <label>Name<input name="name" required minLength={2} /></label>}
            <label>Email<input name="email" type="email" required /></label>
            <label>Password<input name="password" type="password" required minLength={8} /></label>
            <button className="btn portalButton" disabled={loading}>{mode === "register" ? "CREATE CREATOR ACCOUNT →" : "SIGN IN →"}</button>
            {message && <div className="adminMessage">{message}</div>}
          </form>

          <p className="portalHint">Use the same email address you used when submitting films. Existing submissions will be linked automatically.</p>
        </section>
      </main>
    </div>;
  }

  const counts = data.submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return <div className="wrap">
    <nav className="nav">
      <a className="brand" href="/">FRONT DOOR</a>
      <div className="navlinks"><a href="/watch">WATCH</a><a href="/submit">NEW SUBMISSION</a><button className="portalLogout" onClick={logout}>LOG OUT</button></div>
    </nav>

    <main className="creatorPortal">
      <header className="portalHeader">
        <div>
          <div className="eyebrow">CREATOR PORTAL</div>
          <h1>Welcome, {data.account.name}.</h1>
          <p>{data.account.email}</p>
        </div>
        <a className="btn" href="/submit">SUBMIT ANOTHER FILM →</a>
      </header>

      <section className="portalStats">
        <div><strong>{data.submissions.length}</strong><span>TOTAL SUBMISSIONS</span></div>
        <div><strong>{counts.NEW || 0}</strong><span>RECEIVED</span></div>
        <div><strong>{counts.REVIEWING || 0}</strong><span>IN REVIEW</span></div>
        <div><strong>{counts.ACCEPTED || 0}</strong><span>ACCEPTED</span></div>
      </section>

      <section className="portalSubmissions">
        <div className="sectionHead"><h2>Your Submissions</h2><span>{data.submissions.length} films</span></div>

        {data.submissions.length === 0
          ? <div className="portalEmpty">
              <h3>No submissions yet.</h3>
              <p>Submit your first AI-native film to Front Door.</p>
              <a className="btn" href="/submit">SUBMIT FILM →</a>
            </div>
          : <div className="submissionCards">
              {data.submissions.map(s => <article className="submissionCard" key={s.id}>
                <div className="submissionCardTop">
                  <div>
                    <span className={"submissionStatus status-" + s.status.toLowerCase()}>{statusCopy[s.status]}</span>
                    <h3>{s.filmTitle}</h3>
                    <small>Submitted {new Date(s.createdAt).toLocaleDateString()}</small>
                  </div>
                  <a href={s.filmUrl} target="_blank" rel="noreferrer">SCREENING LINK ↗</a>
                </div>

                <p>{s.synopsis}</p>

                <div className="submissionMeta">
                  {s.acnFilmId && <span>ACN ID · {s.acnFilmId}</span>}
                  {s.aiTools.length > 0 && <span>AI TOOLS · {s.aiTools.join(", ")}</span>}
                  <span>UPDATED · {new Date(s.updatedAt).toLocaleDateString()}</span>
                </div>

                {s.notes && <div className="submissionNote"><strong>FRONT DOOR NOTE</strong><p>{s.notes}</p></div>}
              </article>)}
            </div>}
      </section>
    </main>

    <footer className="footer">FRONT DOOR NETWORK · CREATOR PORTAL</footer>
  </div>;
}

"use client";

import { FormEvent, useState } from "react";

export default function SubmitPage() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setStatus("");

    const form = new FormData(e.currentTarget);
    const payload = {
      creatorName: String(form.get("creatorName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      filmTitle: String(form.get("filmTitle") || "").trim(),
      synopsis: String(form.get("synopsis") || "").trim(),
      filmUrl: String(form.get("filmUrl") || "").trim(),
      trailerUrl: String(form.get("trailerUrl") || "").trim() || undefined,
      websiteUrl: String(form.get("websiteUrl") || "").trim() || undefined,
      socialUrl: String(form.get("socialUrl") || "").trim() || undefined,
      acnFilmId: String(form.get("acnFilmId") || "").trim() || undefined,
      aiTools: String(form.get("aiTools") || "").split(",").map(v => v.trim()).filter(Boolean),
      rightsConfirmed: form.get("rightsConfirmed") === "on",
      aiNativeConfirmed: form.get("aiNativeConfirmed") === "on",
      company: String(form.get("company") || ""),
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) throw new Error(body?.error || text || "Unable to submit film.");
      setSubmitted(true);
      setStatus(`Submission received for "${payload.filmTitle}". Front Door will review it for programming consideration.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to submit film.");
    } finally {
      setSending(false);
    }
  }

  return <div className="wrap">
    <nav className="nav">
      <a className="brand" href="/">FRONT DOOR</a>
      <div className="navlinks"><a href="/watch">WATCH</a><a href="/">NETWORK</a><a href="/creators/portal">CREATOR PORTAL</a><a href="/submit">SUBMIT</a></div>
    </nav>

    <main className="submitPage">
      <div className="pageIntro submitIntro">
        <div className="eyebrow">FILMMAKER INTAKE</div>
        <h1>SUBMIT TO FRONT DOOR</h1>
        <p>Front Door curates AI-native cinema for web and Roku distribution. Submit a completed film or secure screening link for programming consideration.</p>
      </div>

      <div className="submitGrid">
        <form className="submissionForm" onSubmit={submit}>
          <div className="formTwo">
            <label>Creator / Filmmaker Name<input name="creatorName" required /></label>
            <label>Email<input name="email" type="email" required /></label>
          </div>

          <label>Film Title<input name="filmTitle" required /></label>
          <label>Synopsis<textarea name="synopsis" required rows={6} minLength={20} placeholder="Tell us what the film is about and why it belongs on Front Door." /></label>
          <label>Film / Screening URL<input name="filmUrl" type="url" required placeholder="https://..." /><span className="fieldNote">Use a secure screener, hosted master, or accessible review link.</span></label>

          <div className="formTwo">
            <label>Trailer URL<input name="trailerUrl" type="url" placeholder="https://..." /></label>
            <label>ACN Film ID<input name="acnFilmId" placeholder="Optional" /></label>
          </div>

          <div className="formTwo">
            <label>Website<input name="websiteUrl" type="url" placeholder="https://..." /></label>
            <label>Social / Creator Profile<input name="socialUrl" type="url" placeholder="https://..." /></label>
          </div>

          <label>AI Tools Used<input name="aiTools" placeholder="Runway, Veo, Kling, Midjourney..." /></label>

          <div className="submitChecks">
            <label className="check"><input type="checkbox" name="rightsConfirmed" required /> I control the rights necessary to submit and authorize Front Door to review this film.</label>
            <label className="check"><input type="checkbox" name="aiNativeConfirmed" required /> This film uses AI as a material part of its creative or production workflow.</label>
          </div>

          <input className="hpField" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <button className="btn submitButton" disabled={sending || submitted}>{sending ? "SUBMITTING..." : submitted ? "SUBMISSION RECEIVED" : "SUBMIT FILM →"}</button>
          {status && <div className={submitted ? "submitSuccess" : "adminMessage"}>{status}</div>}
        </form>

        <aside className="submitAside">
          <span className="tag">WHAT WE LOOK FOR</span>
          <h2>AI-native. Finished. Distinct.</h2>
          <p>Front Door is not a general upload platform. Programming is curated around films that use AI meaningfully and have a clear creative point of view.</p>
          <div className="submitCriteria">
            <div><strong>01</strong><span>Completed or review-ready film</span></div>
            <div><strong>02</strong><span>Clear rights to submit</span></div>
            <div><strong>03</strong><span>Material AI-native workflow</span></div>
            <div><strong>04</strong><span>Strong story, concept or visual identity</span></div>
          </div>
          <p className="submitNote">Submission does not guarantee distribution or placement. Accepted films are programmed into Front Door shelves and prepared for network delivery.</p>
        </aside>
      </div>
    </main>

    <footer className="footer publicFooter"><span>FRONT DOOR NETWORK · FILMMAKER INTAKE</span><a href="/sponsor">SPONSOR / PARTNER</a></footer>
  </div>;
}

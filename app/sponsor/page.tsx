"use client";

import { FormEvent, useState } from "react";

export default function SponsorPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      company: String(form.get("company") || "").trim(),
      email: String(form.get("email") || "").trim(),
      websiteUrl: String(form.get("websiteUrl") || "").trim() || undefined,
      budget: String(form.get("budget") || "").trim() || undefined,
      interest: String(form.get("interest") || "").trim(),
      message: String(form.get("message") || "").trim() || undefined,
      organization: String(form.get("organization") || ""),
    };

    try {
      const res = await fetch("/api/sponsor-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(body?.error || text || "Unable to send sponsor inquiry.");
      setSent(true);
      setMessage("Your partnership inquiry has been received. Front Door will follow up directly.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to send sponsor inquiry.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="wrap">
    <nav className="nav">
      <a className="brand" href="/">FRONT DOOR</a>
      <div className="navlinks">
        <a href="/watch">WATCH</a>
        <a href="/creators/portal">CREATORS</a>
        <a href="/submit">SUBMIT</a>
      </div>
    </nav>

    <main className="sponsorPage">
      <section className="sponsorHero">
        <div className="eyebrow">BRAND PARTNERSHIPS</div>
        <h1>PARTNER WITH THE FRONT DOOR TO AI CINEMA.</h1>
        <p>Front Door gives brands a way to participate in an emerging category of AI-native film and entertainment through thoughtful, clearly identified sponsorship.</p>
        <a className="btn" href="#inquiry">START A CONVERSATION →</a>
      </section>

      <section className="sponsorInventory">
        <div className="sectionHead"><h2>Partnership Opportunities</h2><span>Built around the network</span></div>
        <div className="sponsorCards">
          <article><span>01</span><h3>Network Partner</h3><p>Brand presence around Front Door as a whole, including selected network surfaces and campaign moments.</p></article>
          <article><span>02</span><h3>Shelf Sponsor</h3><p>Associate a brand with a specific programming shelf such as Neural Broadcast, First Broadcast, or The Lab.</p></article>
          <article><span>03</span><h3>Premiere Partner</h3><p>Support a featured release, creator premiere, or special programming moment with clearly labeled sponsorship.</p></article>
          <article><span>04</span><h3>Creator & Event Partner</h3><p>Build activations around filmmakers, screenings, festivals, creator conversations, and AI cinema culture.</p></article>
        </div>
      </section>

      <section className="sponsorPrinciples">
        <div>
          <span className="tag">OUR APPROACH</span>
          <h2>Sponsorship should add value—not interrupt the film.</h2>
        </div>
        <div className="sponsorPrincipleGrid">
          <p><strong>Clearly identified.</strong> Sponsored placements are labeled and kept distinct from editorial programming decisions.</p>
          <p><strong>Category relevant.</strong> We prioritize technology, creative tools, entertainment, culture, and brands that fit the audience.</p>
          <p><strong>Creator respectful.</strong> Partnerships should support the ecosystem without compromising a filmmaker’s work or identity.</p>
          <p><strong>Flexible.</strong> Packages can be structured around the network, a shelf, a title, a premiere, or a live activation.</p>
        </div>
      </section>

      <section className="sponsorInquiry" id="inquiry">
        <div className="sponsorInquiryCopy">
          <div className="eyebrow">PARTNERSHIP INQUIRY</div>
          <h2>Tell us what you want to build.</h2>
          <p>Share your brand, objective, and the type of partnership you are exploring. We can shape the opportunity around the right Front Door surface.</p>
        </div>

        <form className="submissionForm sponsorForm" onSubmit={submit}>
          <div className="formTwo">
            <label>Name<input name="name" required /></label>
            <label>Company<input name="company" required /></label>
          </div>

          <div className="formTwo">
            <label>Email<input name="email" type="email" required /></label>
            <label>Website<input name="websiteUrl" type="url" placeholder="https://..." /></label>
          </div>

          <div className="formTwo">
            <label>Partnership Interest
              <select name="interest" required defaultValue="">
                <option value="" disabled>Select an option</option>
                <option value="Network Partner">Network Partner</option>
                <option value="Shelf Sponsor">Shelf Sponsor</option>
                <option value="Premiere Partner">Premiere Partner</option>
                <option value="Creator or Event Partner">Creator or Event Partner</option>
                <option value="Custom Partnership">Custom Partnership</option>
              </select>
            </label>
            <label>Estimated Budget
              <select name="budget" defaultValue="">
                <option value="">Prefer not to say</option>
                <option value="Under $5,000">Under $5,000</option>
                <option value="$5,000–$15,000">$5,000–$15,000</option>
                <option value="$15,000–$50,000">$15,000–$50,000</option>
                <option value="$50,000+">$50,000+</option>
              </select>
            </label>
          </div>

          <label>What are you looking to accomplish?<textarea name="message" rows={5} placeholder="Campaign goals, timing, audience, launch, event, creator activation..." /></label>
          <input className="hpField" name="organization" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <button className="btn submitButton" disabled={loading || sent}>{loading ? "SENDING..." : sent ? "INQUIRY RECEIVED" : "SEND PARTNERSHIP INQUIRY →"}</button>
          {message && <div className={sent ? "submitSuccess" : "adminMessage"}>{message}</div>}
        </form>
      </section>
    </main>

    <footer className="footer publicFooter">
      <span>FRONT DOOR NETWORK · THE FRONT DOOR TO AI CINEMA</span>
      <a href="/sponsor">SPONSOR / PARTNER</a>
    </footer>
  </div>;
}

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const shelves = await db.shelf.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => []);
  return <>
    <div className="wrap">
      <nav className="nav">
        <div className="brand">FRONT DOOR</div>
        <div className="navlinks"><a href="#watch">WATCH</a><a href="#shelves">FILMS</a><a href="#creators">CREATORS</a><a href="#submit">SUBMIT</a><a href="#about">ABOUT</a></div>
      </nav>
      <main>
        <section className="hero" id="watch">
          <div>
            <div className="eyebrow">AI-NATIVE BROADCAST NETWORK</div>
            <h1>THE FRONT DOOR TO AI CINEMA.</h1>
            <p>Original films. New filmmakers. A curated network built for the age of artificial intelligence—on the web and on Roku.</p>
            <a className="btn" href="#shelves">EXPLORE THE NETWORK →</a>
          </div>
          <aside className="heroSide"><span className="tag">TRANSMISSION STATUS</span><strong>FRONT DOOR v2</strong><p>Content infrastructure is being rebuilt for direct shelf publishing to Roku.</p></aside>
        </section>

        <section className="section" id="shelves"><div className="sectionHead"><h2>Network Shelves</h2><span>Curated AI cinema</span></div>
          <div className="shelves">{(shelves.length ? shelves : fallbackShelves).map((s:any) => <article className="card" key={s.slug}><span className="tag">SHELF</span><div><b>{s.name}</b><p>{s.description}</p></div></article>)}</div>
        </section>
        <section className="section" id="creators"><div className="sectionHead"><h2>Creators First.</h2><span>Powered by the AI Cinema ecosystem</span></div><p style={{maxWidth:720,color:'#aaa',fontSize:18,lineHeight:1.6}}>Front Door is a curated distribution layer for AI-native filmmakers. Creator and film identities can connect back to AI Cinema Network records while Front Door handles programming and broadcast presentation.</p></section>
        <section className="section" id="submit"><div className="sectionHead"><h2>Submit to Front Door</h2><span>Coming with v2 intake</span></div><p style={{maxWidth:720,color:'#aaa',fontSize:18,lineHeight:1.6}}>Submission workflow will connect creator identity, film metadata, rights confirmation, Bunny Stream media, artwork, captions and Roku shelf placement.</p></section>
      </main>
      <footer className="footer" id="about">FRONT DOOR NETWORK · AI CINEMA BROADCAST INFRASTRUCTURE</footer>
    </div>
  </>;
}

const fallbackShelves = [
  {name:'Neural Broadcast',slug:'neural-broadcast',description:"Front Door's featured AI cinema transmission."},
  {name:'Synthetic Stories',slug:'synthetic-stories',description:'Narrative films created with AI-native workflows.'},
  {name:'Machine Dreams',slug:'machine-dreams',description:'Surreal, experimental and visually ambitious AI cinema.'},
  {name:'First Broadcast',slug:'first-broadcast',description:'Premieres and newly released films.'},
  {name:'Extended Transmission',slug:'extended-transmission',description:'Long-form films, specials and extended works.'},
  {name:'The Lab',slug:'the-lab',description:'Experiments, prototypes and emerging forms.'}
];

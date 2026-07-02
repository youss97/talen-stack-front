"use client";
/**
 * GW — Aperçu du Design System (page de validation, non liée aux écrans réels).
 * Ouvre /design-system pour visualiser tokens + composants de base.
 */
import { useState, type ReactNode } from "react";

const brandScale = [
  ["--brand-soft", "#F1F7E1"],
  ["--brand", "#8AB925"],
  ["--brand-strong", "#6E9A1D"],
  ["--brand-deep", "#55791A"],
  ["--brand-ink", "#26340F"],
];
const surfaces = [
  ["--bg", "#F7F8F3"],
  ["--surface", "#FFFFFF"],
  ["--surface-2", "#FBFCF8"],
  ["--border", "#E7EBDE"],
  ["--border-strong", "#D6DCCA"],
];
const texts = [
  ["--text", "#1B2413"],
  ["--text-2", "#5E6B52"],
  ["--text-3", "#95A085"],
];
const statuses = [
  ["Blue", "--blue", "gw-badge-blue"],
  ["Amber", "--amber", "gw-badge-amber"],
  ["Violet", "--violet", "gw-badge-violet"],
  ["Rose", "--rose", "gw-badge-rose"],
];

function Swatch({ name, value, ink }: { name: string; value: string; ink?: boolean }) {
  return (
    <div className="gw-card-flat" style={{ overflow: "hidden" }}>
      <div style={{ height: 64, background: value }} />
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "monospace" }}>{value}</div>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</h2>
      {desc && <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4 }}>{desc}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const [err, setErr] = useState(false);
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 80px" }}>
        <header style={{ marginBottom: 40 }}>
          <div className="gw-badge gw-badge-brand" style={{ marginBottom: 12 }}>
            <span className="gw-badge-dot" /> Design System GW
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Aperçu — à valider</h1>
          <p style={{ fontSize: 16, color: "var(--text-2)", marginTop: 6, maxWidth: 640 }}>
            Système visuel : marque lime, surfaces chaudes, typographie Inter, coins doux, bordures fines.
            Valide ces bases avant l'application écran par écran.
          </p>
        </header>

        {/* Couleurs */}
        <Section title="Couleurs — marque" desc="Le lime décliné : soft → ink. Le primaire utilise le texte encre (contraste AA).">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {brandScale.map(([n, v]) => <Swatch key={n} name={n} value={v} />)}
          </div>
        </Section>

        <Section title="Couleurs — surfaces & texte">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {[...surfaces, ...texts].map(([n, v]) => <Swatch key={n} name={n} value={v} />)}
          </div>
        </Section>

        <Section title="Couleurs — statuts" desc="Distincts du vert de marque, avec leur variante « soft » en fond.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {statuses.map(([label, , cls]) => (
              <span key={label} className={`gw-badge ${cls}`}><span className="gw-badge-dot" /> {label}</span>
            ))}
            <span className="gw-badge gw-badge-brand"><span className="gw-badge-dot" /> Marque</span>
            <span className="gw-badge gw-badge-neutral">Neutre</span>
          </div>
        </Section>

        {/* Typographie */}
        <Section title="Typographie" desc="Inter / system-ui — échelle 12 / 13.5 / 14 / 16 / 20 / 22 / 26.">
          <div className="gw-card" style={{ padding: 24, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Titre 26 — Recrutement</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>Titre 22 — Pipeline des candidats</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Titre 20 — Section</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Corps 16 — Texte principal lisible et confortable.</div>
            <div style={{ fontSize: 14, color: "var(--text-2)" }}>Corps 14 — Texte secondaire.</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)" }}>Label 13.5 — Étiquettes de champ.</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>Meta 12 — Légendes et métadonnées.</div>
          </div>
        </Section>

        {/* Boutons */}
        <Section title="Boutons" desc="Une action primaire lime par écran ; le reste en secondaire/ghost.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <button className="gw-btn gw-btn-primary">Enregistrer les modifications</button>
            <button className="gw-btn gw-btn-cta">Nouveau candidat</button>
            <button className="gw-btn gw-btn-ghost">Annuler</button>
            <button className="gw-btn gw-btn-text">Voir plus</button>
            <button className="gw-btn gw-btn-danger">Supprimer</button>
            <button className="gw-btn gw-btn-primary" disabled>Désactivé</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 12 }}>
            <button className="gw-btn gw-btn-primary gw-btn-sm">Petit</button>
            <button className="gw-btn gw-btn-primary">Défaut</button>
            <button className="gw-btn gw-btn-primary gw-btn-lg">Grand</button>
          </div>
        </Section>

        {/* Champs */}
        <Section title="Champs" desc="Focus ring vert visible, états erreur/désactivé gérés.">
          <div className="gw-card" style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 640 }}>
            <div>
              <label className="gw-field-label">Nom du candidat</label>
              <input className="gw-input" placeholder="Ex. Sofia Benali" />
              <div className="gw-field-hint">Prénom et nom.</div>
            </div>
            <div>
              <label className="gw-field-label">Email</label>
              <input className={`gw-input ${err ? "gw-input-error" : ""}`} placeholder="sofia@exemple.com" onChange={(e) => setErr(!e.target.value.includes("@"))} />
              {err && <div className="gw-field-error">Adresse email invalide.</div>}
            </div>
            <div>
              <label className="gw-field-label">Poste</label>
              <select className="gw-select"><option>Développeur Full Stack</option><option>Product Designer</option></select>
            </div>
            <div>
              <label className="gw-field-label">Champ désactivé</label>
              <input className="gw-input" placeholder="Confidentiel" disabled />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="gw-field-label">Notes</label>
              <textarea className="gw-textarea" placeholder="Ajouter une note d'équipe…" />
            </div>
          </div>
        </Section>

        {/* Carte candidat (exemple pipeline) */}
        <Section title="Carte candidat (pipeline)" desc="Exemple de carte board : avatar, poste, compétences, statut, survol.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, maxWidth: 640 }}>
            {[
              { n: "Sofia Benali", r: "Développeuse Full Stack", s: "Entretien", cls: "gw-badge-violet", tags: ["React", "Node", "PostgreSQL"] },
              { n: "Yassine Amrani", r: "Product Designer", s: "Présélection", cls: "gw-badge-blue", tags: ["Figma", "UX"] },
            ].map((c) => (
              <div key={c.n} className="gw-card" style={{ padding: 16, transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(27,36,19,.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--ds-shadow-card)"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {c.n.split(" ").map((x) => x[0]).join("")}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.n}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)" }}>{c.r}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {c.tags.map((t) => <span key={t} className="gw-chip">{t}</span>)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span className={`gw-badge ${c.cls}`}><span className="gw-badge-dot" /> {c.s}</span>
                  <button className="gw-btn gw-btn-text gw-btn-sm">Voir</button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Carte de stat */}
        <Section title="Carte de statistique">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, maxWidth: 640 }}>
            {[["Candidats", "248", "+12%"], ["Entretiens", "36", "+4"], ["Embauches", "9", "+2"]].map(([l, v, d]) => (
              <div key={l} className="gw-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13.5, color: "var(--text-2)" }}>{l}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{v}</span>
                  <span className="gw-badge gw-badge-brand" style={{ height: "1.3rem" }}>{d}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

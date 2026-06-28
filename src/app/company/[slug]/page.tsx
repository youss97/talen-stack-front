"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ThreeParticles from "@/components/common/ThreeParticles";

interface Offer {
  id: string;
  title: string;
  description?: string;
  location?: string;
  country?: string;
  contract_type?: string;
  min_experience?: number;
  public_slug?: string;
}
interface Landing {
  company: { name: string; logo_path?: string; description?: string; brand_color?: string; city?: string; country?: string };
  offers: Offer[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* éclaircit/assombrit une couleur hex */
function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function CompanyLandingPage() {
  const { slug } = useParams() as { slug: string };
  const [data, setData] = useState<Landing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fContract, setFContract] = useState("");
  const [fCountry, setFCountry] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fExp, setFExp] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const [openSpontaneous, setOpenSpontaneous] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API}/public/company/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Entreprise non trouvée"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Listes uniques pour les filtres pays / villes
  const countries = useMemo(
    () => Array.from(new Set((data?.offers || []).map((o) => o.country).filter(Boolean))) as string[],
    [data],
  );
  const cities = useMemo(
    () => Array.from(new Set((data?.offers || [])
      .filter((o) => !fCountry || o.country === fCountry)
      .map((o) => o.location).filter(Boolean))) as string[],
    [data, fCountry],
  );

  const offers = useMemo(() => {
    let list = data?.offers || [];
    if (fContract) list = list.filter((o) => (o.contract_type || "").toLowerCase().includes(fContract.toLowerCase()));
    if (fCountry) list = list.filter((o) => o.country === fCountry);
    if (fLocation) list = list.filter((o) => o.location === fLocation);
    if (fExp) list = list.filter((o) => (o.min_experience ?? 0) <= Number(fExp));
    return list;
  }, [data, fContract, fCountry, fLocation, fExp]);

  const totalPages = Math.max(1, Math.ceil(offers.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedOffers = offers.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  useEffect(() => { setPage(1); }, [fContract, fCountry, fLocation, fExp]);

  const submitSpontaneous = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const r = await fetch(`${API}/public/company/${slug}/spontaneous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      setSent(true);
      setOpenSpontaneous(false);
    } catch {
      setError("Erreur lors de l'envoi de la candidature");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  if (error && !data) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!data) return null;

  const c = data.company;
  const brand = c.brand_color || "#8AB925";
  const brandDark = shade(brand, -0.25);
  const logoSrc = c.logo_path ? (c.logo_path.startsWith("http") ? c.logo_path : `${API}/${c.logo_path}`) : "";

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ── HERO ── */}
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${brandDark}, ${brand})` }}>
        <ThreeParticles color="#ffffff" count={60} opacity={0.5} />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt={c.name} className="h-20 w-20 rounded-2xl object-contain bg-white p-2 shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-lg">
                {c.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.name}</h1>
              {(c.city || c.country) && (
                <p className="mt-1 text-white/80 text-sm">{[c.city, c.country].filter(Boolean).join(", ")}</p>
              )}
            </div>
          </div>
          {c.description && (
            <p className="mt-6 max-w-2xl mx-auto sm:mx-0 text-white/90 leading-relaxed whitespace-pre-wrap text-center sm:text-left">
              {c.description}
            </p>
          )}
          <div className="mt-8 flex justify-center sm:justify-start">
            <button
              onClick={() => setOpenSpontaneous(true)}
              className="px-6 py-3 rounded-xl bg-white text-sm font-semibold shadow-lg hover:scale-[1.02] transition-transform"
              style={{ color: brandDark }}
            >
              Candidature spontanée
            </button>
          </div>
        </div>
        {/* vague décorative */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 40 }}>
          <path fill="#f9fafb" d="M0,32 C360,64 1080,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </header>

      <main className="max-w-5xl mx-auto px-6 -mt-6 relative">
        {sent && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm shadow-sm">
            ✅ Votre candidature spontanée a bien été envoyée. Merci !
          </div>
        )}

        {/* Filtres */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={fContract} onChange={(e) => setFContract(e.target.value)} placeholder="Type de contrat" className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2" style={{ ["--tw-ring-color" as string]: brand }} />
            <select value={fCountry} onChange={(e) => { setFCountry(e.target.value); setFLocation(""); }} className="h-11 rounded-xl border border-gray-200 px-4 text-sm bg-white focus:outline-none focus:ring-2" style={{ ["--tw-ring-color" as string]: brand }}>
              <option value="">Pays (tous)</option>
              {countries.map((c2) => <option key={c2} value={c2}>{c2}</option>)}
            </select>
            <select value={fLocation} onChange={(e) => setFLocation(e.target.value)} className="h-11 rounded-xl border border-gray-200 px-4 text-sm bg-white focus:outline-none focus:ring-2" style={{ ["--tw-ring-color" as string]: brand }}>
              <option value="">Ville (toutes)</option>
              {cities.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input value={fExp} onChange={(e) => setFExp(e.target.value)} type="number" min={0} placeholder="Expérience max (ans)" className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2" style={{ ["--tw-ring-color" as string]: brand }} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Offres d&apos;emploi</h2>
          <span className="text-sm text-gray-400">{offers.length} offre{offers.length > 1 ? "s" : ""}</span>
        </div>

        {/* Cards offres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pagedOffers.map((o) => (
            <div
              key={o.id}
              className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg transition-all overflow-hidden"
            >
              <span className="absolute left-0 top-0 h-full w-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: brand }} />
              <h3 className="font-semibold text-gray-900 text-lg pr-4">{o.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(o.location || o.country) && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{[o.location, o.country].filter(Boolean).join(", ")}</span>}
                {o.contract_type && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{o.contract_type}</span>}
                {o.min_experience ? <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{o.min_experience} an(s) d&apos;expérience</span> : null}
              </div>
              {o.description && <p className="mt-3 text-sm text-gray-500 line-clamp-3">{o.description}</p>}
              <a
                href={o.public_slug ? `/apply/${o.public_slug}` : "#"}
                className="mt-5 inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: brand }}
              >
                Voir les détails
              </a>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
              Aucune offre disponible pour ces critères.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 disabled:opacity-40"
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-9 h-9 rounded-lg text-sm font-medium border transition-colors"
                style={p === safePage ? { background: brand, color: "#fff", borderColor: brand } : { borderColor: "#e5e7eb", color: "#6b7280", background: "#fff" }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </main>

      {/* ── FOOTER FIXE ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} {c.name}</span>
          <span>Powered by <span className="font-semibold text-gray-500">TalentStack</span></span>
        </div>
      </footer>

      {/* ── MODAL candidature spontanée ── */}
      {openSpontaneous && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenSpontaneous(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Candidature spontanée</h3>
            <p className="text-sm text-gray-400 mb-4">Envoyez votre profil à {c.name}</p>
            <form onSubmit={submitSpontaneous} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Prénom" className="h-11 rounded-xl border border-gray-200 px-4 text-sm" />
                <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Nom" className="h-11 rounded-xl border border-gray-200 px-4 text-sm" />
              </div>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" />
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message (optionnel)" rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpenSpontaneous(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">Annuler</button>
                <button type="submit" disabled={sending} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: brand }}>
                  {sending ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

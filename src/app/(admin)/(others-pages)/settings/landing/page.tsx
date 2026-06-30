"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState } from "@/lib/store";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useGetLandingQuery,
  useUpdateLandingMutation,
  useGetContactMessagesQuery,
  useMarkMessageReadMutation,
  type LandingData,
} from "@/lib/services/landingApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

const input = "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700";
const card = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function uploadImage(file: File): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "landing");
  const res = await fetch(`${API}/upload/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error("upload failed");
  const json = await res.json();
  return json?.data?.url as string;
}

export default function LandingEditorPage() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const isSuperAdmin = user?.role?.code === "super_admin";
  useEffect(() => {
    if (user && !isSuperAdmin) router.replace("/settings");
  }, [user, isSuperAdmin, router]);

  const { data, isLoading } = useGetLandingQuery();
  const [updateLanding, { isLoading: saving }] = useUpdateLandingMutation();
  const { data: messages } = useGetContactMessagesQuery();
  const [markRead] = useMarkMessageReadMutation();

  const [form, setForm] = useState<LandingData>({});
  const [tab, setTab] = useState<"content" | "messages">("content");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [partnerUploadingIdx, setPartnerUploadingIdx] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (variant: ToastItem["variant"], title: string, message?: string) =>
    setToasts((p) => [...p, { id: Date.now().toString(), variant, title, message }]);
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async () => {
    try {
      await updateLanding(form).unwrap();
      addToast("success", "Enregistré", "Landing page mise à jour");
    } catch (err) {
      addToast("error", "Erreur", getApiErrorMessage(err, "Échec de l'enregistrement"));
    }
  };

  // Helpers de mise à jour
  const setHero = (k: string, v: string) => setForm((f) => ({ ...f, hero: { ...f.hero, [k]: v } }));
  const setAbout = (k: string, v: string) => setForm((f) => ({ ...f, about: { ...f.about, [k]: v } }));
  const setContact = (k: string, v: string) => setForm((f) => ({ ...f, contact: { ...f.contact, [k]: v } }));

  const features = form.features || [];
  const pricing = form.pricing || [];
  const testimonials = form.testimonials || [];
  const partners = form.partners || [];

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  return (
    <div className="w-full">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Landing page</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez le contenu public : textes, tarifs, témoignages, contact.</p>
        </div>
        <div className="flex gap-2">
          <a href="/?preview=1" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300">Aperçu</a>
          {tab === "content" && <Button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/40">
        {([["content", "Contenu"], ["messages", `Messages${messages?.total ? ` (${messages.total})` : ""}`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
        ))}
      </div>

      {tab === "content" ? (
        <div className="space-y-5">
          {/* Identité du site (logo header + nom) */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">Identité (header)</h2>
            <div className="space-y-3">
              <input className={input} placeholder="Nom du site (ex: Talent Stack)" value={form.siteName || ""} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} />
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="logo" className="h-10 max-w-[160px] object-contain rounded border border-gray-200 p-1" />
                ) : (
                  <div className="h-10 w-10 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">Logo</div>
                )}
                <label className={`cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 ${uploadingLogo ? "opacity-50" : ""}`}>
                  {uploadingLogo ? "Upload…" : "Uploader le logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingLogo(true);
                      try {
                        const url = await uploadImage(file);
                        setForm((f) => ({ ...f, logoUrl: url }));
                        addToast("success", "Logo ajouté", "N'oubliez pas d'enregistrer");
                      } catch {
                        addToast("error", "Erreur", "Échec de l'upload du logo");
                      } finally {
                        setUploadingLogo(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                {form.logoUrl && (
                  <button onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))} className="text-xs text-gray-400 hover:text-red-500">Retirer</button>
                )}
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">Section Hero</h2>
            <div className="space-y-3">
              <input className={input} placeholder="Titre" value={form.hero?.title || ""} onChange={(e) => setHero("title", e.target.value)} />
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={2} placeholder="Sous-titre" value={form.hero?.subtitle || ""} onChange={(e) => setHero("subtitle", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Texte du bouton" value={form.hero?.ctaText || ""} onChange={(e) => setHero("ctaText", e.target.value)} />
                <input className={input} placeholder="Lien du bouton (#contact)" value={form.hero?.ctaLink || ""} onChange={(e) => setHero("ctaLink", e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-300">Couleur de marque</label>
                <input type="color" value={form.brandColor || "#8AB925"} onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))} className="h-9 w-14 rounded-lg border border-gray-300 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* À propos */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">Section « À propos »</h2>
            <div className="space-y-3">
              <input className={input} placeholder="Titre" value={form.about?.title || ""} onChange={(e) => setAbout("title", e.target.value)} />
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={2} placeholder="Texte" value={form.about?.text || ""} onChange={(e) => setAbout("text", e.target.value)} />
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">Fonctionnalités</h2>
              <button onClick={() => setForm((f) => ({ ...f, features: [...(f.features || []), { title: "", text: "" }] }))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">+ Ajouter</button>
            </div>
            <div className="space-y-3">
              {features.map((feat, i) => (
                <div key={i} className="flex gap-2">
                  <input className={input + " flex-1"} placeholder="Titre" value={feat.title} onChange={(e) => setForm((f) => ({ ...f, features: features.map((x, j) => j === i ? { ...x, title: e.target.value } : x) }))} />
                  <input className={input + " flex-1"} placeholder="Description" value={feat.text || ""} onChange={(e) => setForm((f) => ({ ...f, features: features.map((x, j) => j === i ? { ...x, text: e.target.value } : x) }))} />
                  <button onClick={() => setForm((f) => ({ ...f, features: features.filter((_, j) => j !== i) }))} className="h-10 px-2 rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Tarifs */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">Tarifs</h2>
              <button onClick={() => setForm((f) => ({ ...f, pricing: [...(f.pricing || []), { name: "", price: "", currency: "€", cycle: "/mois", features: [], ctaText: "" }] }))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">+ Ajouter un plan</button>
            </div>
            <div className="space-y-4">
              {pricing.map((p, i) => {
                const upd = (patch: Partial<typeof p>) => setForm((f) => ({ ...f, pricing: pricing.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
                const move = (dir: -1 | 1) => setForm((f) => {
                  const arr = [...pricing]; const t = i + dir;
                  if (t < 0 || t >= arr.length) return f;
                  [arr[i], arr[t]] = [arr[t], arr[i]];
                  return { ...f, pricing: arr };
                });
                return (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Plan {i + 1}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => move(-1)} disabled={i === 0} className="h-7 w-7 rounded border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40">↑</button>
                        <button onClick={() => move(1)} disabled={i === pricing.length - 1} className="h-7 w-7 rounded border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40">↓</button>
                        <button onClick={() => setForm((f) => ({ ...f, pricing: pricing.filter((_, j) => j !== i) }))} className="h-7 px-2 rounded border border-error-300 text-error-500 text-xs">Supprimer</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input className={input} placeholder="Nom du plan" value={p.name} onChange={(e) => upd({ name: e.target.value })} />
                      <input className={input} placeholder="Prix (ex: 49)" value={p.price} onChange={(e) => upd({ price: e.target.value })} />
                      <select className={input} value={p.currency ?? "€"} onChange={(e) => upd({ currency: e.target.value })}>
                        <option value="€">€ (EUR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="MAD">MAD</option>
                        <option value="£">£ (GBP)</option>
                        <option value="">Aucune</option>
                      </select>
                      <select className={input} value={p.cycle ?? "/mois"} onChange={(e) => upd({ cycle: e.target.value })}>
                        <option value="/mois">/ mois</option>
                        <option value="/an">/ an</option>
                        <option value="">Ponctuel / Sur devis</option>
                      </select>
                    </div>
                    <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={3} placeholder="Une fonctionnalité par ligne" value={(p.features || []).join("\n")} onChange={(e) => upd({ features: e.target.value.split("\n").filter(Boolean) })} />
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input type="checkbox" checked={!!p.highlighted} onChange={(e) => upd({ highlighted: e.target.checked })} /> Plan populaire
                      </label>
                      <input className={input + " max-w-[200px]"} placeholder="Texte du bouton" value={p.ctaText || ""} onChange={(e) => upd({ ctaText: e.target.value })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Témoignages */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">Témoignages clients</h2>
              <button onClick={() => setForm((f) => ({ ...f, testimonials: [...(f.testimonials || []), { name: "", role: "", company: "", text: "", rating: 5 }] }))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">+ Ajouter</button>
            </div>
            <div className="space-y-4">
              {testimonials.map((t, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <input className={input} placeholder="Nom" value={t.name} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                    <input className={input} placeholder="Rôle" value={t.role || ""} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => j === i ? { ...x, role: e.target.value } : x) }))} />
                    <input className={input} placeholder="Société" value={t.company || ""} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => j === i ? { ...x, company: e.target.value } : x) }))} />
                    <input className={input} type="number" min={1} max={5} placeholder="Note /5" value={t.rating || 5} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => j === i ? { ...x, rating: Number(e.target.value) } : x) }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar} alt="" className="h-9 w-9 rounded-full object-cover border" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold">{t.name?.[0] || "?"}</div>
                    )}
                    <input className={input + " flex-1"} placeholder="URL photo du client (ou uploader →)" value={t.avatar || ""} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => j === i ? { ...x, avatar: e.target.value } : x) }))} />
                    <label className={`shrink-0 cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 ${uploadingIdx === i ? "opacity-50" : ""}`}>
                      {uploadingIdx === i ? "Upload…" : "Uploader"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingIdx === i}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingIdx(i);
                          try {
                            const url = await uploadImage(file);
                            setForm((f) => ({ ...f, testimonials: (f.testimonials || []).map((x, j) => (j === i ? { ...x, avatar: url } : x)) }));
                            addToast("success", "Photo ajoutée");
                          } catch {
                            addToast("error", "Erreur", "Échec de l'upload de la photo");
                          } finally {
                            setUploadingIdx(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <textarea className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={2} placeholder="Témoignage" value={t.text} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => j === i ? { ...x, text: e.target.value } : x) }))} />
                    <button onClick={() => setForm((f) => ({ ...f, testimonials: testimonials.filter((_, j) => j !== i) }))} className="h-9 px-3 self-start rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partenaires */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">Logos partenaires</h2>
              <button onClick={() => setForm((f) => ({ ...f, partners: [...(f.partners || []), { name: "", logoUrl: "" }] }))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">+ Ajouter</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partners.map((p, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" className="h-10 w-20 rounded object-contain border bg-white" />
                    ) : (
                      <div className="h-10 w-20 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">Logo</div>
                    )}
                    <label className={`shrink-0 cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 ${partnerUploadingIdx === i ? "opacity-50" : ""}`}>
                      {partnerUploadingIdx === i ? "Upload…" : "Uploader"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={partnerUploadingIdx === i}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setPartnerUploadingIdx(i);
                          try {
                            const url = await uploadImage(file);
                            setForm((f) => ({ ...f, partners: (f.partners || []).map((x, j) => (j === i ? { ...x, logoUrl: url } : x)) }));
                            addToast("success", "Logo ajouté");
                          } catch {
                            addToast("error", "Erreur", "Échec de l'upload du logo");
                          } finally {
                            setPartnerUploadingIdx(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    <button onClick={() => setForm((f) => ({ ...f, partners: (f.partners || []).filter((_, j) => j !== i) }))} className="ml-auto h-9 px-3 rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                  </div>
                  <input className={input} placeholder="Nom du partenaire (optionnel)" value={p.name || ""} onChange={(e) => setForm((f) => ({ ...f, partners: (f.partners || []).map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                </div>
              ))}
              {partners.length === 0 && (
                <p className="text-sm text-gray-400 italic col-span-full">Aucun partenaire. Cliquez sur « + Ajouter » pour insérer un logo.</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">Coordonnées & réseaux</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className={input} placeholder="Email" value={form.contact?.email || ""} onChange={(e) => setContact("email", e.target.value)} />
              <input className={input} placeholder="Téléphone" value={form.contact?.phone || ""} onChange={(e) => setContact("phone", e.target.value)} />
              <input className={input} placeholder="Adresse" value={form.contact?.address || ""} onChange={(e) => setContact("address", e.target.value)} />
              <input className={input} placeholder="LinkedIn (URL)" value={form.contact?.linkedin || ""} onChange={(e) => setContact("linkedin", e.target.value)} />
              <input className={input} placeholder="Instagram (URL)" value={form.contact?.instagram || ""} onChange={(e) => setContact("instagram", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </div>
      ) : (
        /* Messages de contact */
        <div className={card}>
          {!messages || messages.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Aucun message.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {messages.data.map((m) => (
                <li key={m.id} className={`py-4 ${!m.is_read ? "" : "opacity-70"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {m.name} <span className="font-normal text-gray-400">· {m.email}</span>
                        {m.phone && <span className="font-normal text-gray-400"> · ☎ {m.phone}</span>}
                        {!m.is_read && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">Nouveau</span>}
                      </p>
                      {m.subject && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{m.subject}</p>}
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{m.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                    {!m.is_read && (
                      <button onClick={() => markRead(m.id)} className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-700">Marquer lu</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

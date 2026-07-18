"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { RootState } from "@/lib/store";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useGetLandingQuery,
  useUpdateLandingMutation,
  useGetContactMessagesQuery,
  useMarkMessageReadMutation,
  type LandingData,
  type LandingLocale,
  type LandingLocalizedContent,
} from "@/lib/services/landingApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

const input = "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700";
const card = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const LOCALES: LandingLocale[] = ["fr", "en", "ar"];
const LOCALE_LABELS: Record<LandingLocale, string> = { fr: "Français", en: "English", ar: "العربية" };

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
  const t = useTranslations("settings.landing");
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
  const [activeLocale, setActiveLocale] = useState<LandingLocale>("fr");
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
      addToast("success", t("toasts.savedTitle"), t("toasts.savedMessage"));
    } catch (err) {
      addToast("error", t("toasts.errorTitle"), getApiErrorMessage(err, t("toasts.errorMessage")));
    }
  };

  // Contenu éditorial de la langue active
  const localized: LandingLocalizedContent = form.locales?.[activeLocale] || {};
  const setLocalized = (patch: Partial<LandingLocalizedContent>) =>
    setForm((f) => ({
      ...f,
      locales: {
        ...f.locales,
        [activeLocale]: { ...(f.locales?.[activeLocale] || {}), ...patch },
      },
    }));

  // Helpers de mise à jour (langue active)
  const setHero = (k: string, v: string) => setLocalized({ hero: { ...localized.hero, [k]: v } });
  const setAbout = (k: string, v: string) => setLocalized({ about: { ...localized.about, [k]: v } });
  const setContact = (k: string, v: string) => setLocalized({ contact: { ...localized.contact, [k]: v } });

  const features = localized.features || [];
  const pricing = localized.pricing || [];
  const testimonials = localized.testimonials || [];
  const partners = localized.partners || [];

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  return (
    <div className="w-full">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <a href="/?preview=1" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300">{t("preview")}</a>
          {tab === "content" && <Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/40">
        {([["content", t("tabs.content")], ["messages", messages?.total ? t("tabs.messagesWithCount", { count: messages.total }) : t("tabs.messages")]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
        ))}
      </div>

      {tab === "content" ? (
        <div className="space-y-5">
          {/* Sélecteur de langue du contenu éditorial */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("languageTabs.label")}</span>
            <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/40">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setActiveLocale(loc)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeLocale === loc ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>

          {/* Identité du site (logo header + nom) — commune à toutes les langues */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">{t("identity.title")}</h2>
            <div className="space-y-3">
              <input className={input} placeholder={t("identity.siteNamePlaceholder")} value={form.siteName || ""} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} />
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt={t("identity.logoAlt")} className="h-10 max-w-[160px] object-contain rounded border border-gray-200 p-1" />
                ) : (
                  <div className="h-10 w-10 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">{t("identity.logoPlaceholder")}</div>
                )}
                <label className={`cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 ${uploadingLogo ? "opacity-50" : ""}`}>
                  {uploadingLogo ? t("identity.uploading") : t("identity.uploadLogo")}
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
                        addToast("success", t("toasts.logoAddedTitle"), t("toasts.logoAddedMessage"));
                      } catch {
                        addToast("error", t("toasts.errorTitle"), t("toasts.logoErrorMessage"));
                      } finally {
                        setUploadingLogo(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                {form.logoUrl && (
                  <button onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))} className="text-xs text-gray-400 hover:text-red-500">{t("identity.removeLogo")}</button>
                )}
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">{t("hero.title")}</h2>
            <div className="space-y-3">
              <input className={input} placeholder={t("hero.titlePlaceholder")} value={localized.hero?.title || ""} onChange={(e) => setHero("title", e.target.value)} />
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={2} placeholder={t("hero.subtitlePlaceholder")} value={localized.hero?.subtitle || ""} onChange={(e) => setHero("subtitle", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder={t("hero.ctaTextPlaceholder")} value={localized.hero?.ctaText || ""} onChange={(e) => setHero("ctaText", e.target.value)} />
                <input className={input} placeholder={t("hero.ctaLinkPlaceholder")} value={localized.hero?.ctaLink || ""} onChange={(e) => setHero("ctaLink", e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-300">{t("hero.brandColorLabel")}</label>
                <input type="color" value={form.brandColor || "#8AB925"} onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))} className="h-9 w-14 rounded-lg border border-gray-300 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* À propos */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">{t("about.title")}</h2>
            <div className="space-y-3">
              <input className={input} placeholder={t("about.titlePlaceholder")} value={localized.about?.title || ""} onChange={(e) => setAbout("title", e.target.value)} />
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={2} placeholder={t("about.textPlaceholder")} value={localized.about?.text || ""} onChange={(e) => setAbout("text", e.target.value)} />
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">{t("features.title")}</h2>
              <button onClick={() => setLocalized({ features: [...features, { title: "", text: "" }] })} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{t("features.addButton")}</button>
            </div>
            <div className="space-y-3">
              {features.map((feat, i) => (
                <div key={i} className="flex gap-2">
                  <input className={input + " flex-1"} placeholder={t("features.titlePlaceholder")} value={feat.title} onChange={(e) => setLocalized({ features: features.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
                  <input className={input + " flex-1"} placeholder={t("features.descriptionPlaceholder")} value={feat.text || ""} onChange={(e) => setLocalized({ features: features.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
                  <button onClick={() => setLocalized({ features: features.filter((_, j) => j !== i) })} className="h-10 px-2 rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Tarifs */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">{t("pricing.title")}</h2>
              <button onClick={() => setLocalized({ pricing: [...pricing, { name: "", price: "", currency: "€", cycle: "/mois", features: [], ctaText: "" }] })} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{t("pricing.addButton")}</button>
            </div>
            <div className="space-y-4">
              {pricing.map((p, i) => {
                const upd = (patch: Partial<typeof p>) => setLocalized({ pricing: pricing.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                const move = (dir: -1 | 1) => {
                  const arr = [...pricing]; const target = i + dir;
                  if (target < 0 || target >= arr.length) return;
                  [arr[i], arr[target]] = [arr[target], arr[i]];
                  setLocalized({ pricing: arr });
                };
                return (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">{t("pricing.planLabel", { index: i + 1 })}</span>
                      <div className="ms-auto flex items-center gap-1">
                        <button onClick={() => move(-1)} disabled={i === 0} className="h-7 w-7 rounded border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40" aria-label={t("pricing.moveUp")}>↑</button>
                        <button onClick={() => move(1)} disabled={i === pricing.length - 1} className="h-7 w-7 rounded border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40" aria-label={t("pricing.moveDown")}>↓</button>
                        <button onClick={() => setLocalized({ pricing: pricing.filter((_, j) => j !== i) })} className="h-7 px-2 rounded border border-error-300 text-error-500 text-xs">{t("pricing.deleteButton")}</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input className={input} placeholder={t("pricing.namePlaceholder")} value={p.name} onChange={(e) => upd({ name: e.target.value })} />
                      <input className={input} placeholder={t("pricing.pricePlaceholder")} value={p.price} onChange={(e) => upd({ price: e.target.value })} />
                      <select className={input} value={p.currency ?? "€"} onChange={(e) => upd({ currency: e.target.value })}>
                        <option value="€">{t("pricing.currency.eur")}</option>
                        <option value="$">{t("pricing.currency.usd")}</option>
                        <option value="MAD">{t("pricing.currency.mad")}</option>
                        <option value="£">{t("pricing.currency.gbp")}</option>
                        <option value="">{t("pricing.currency.none")}</option>
                      </select>
                      <select className={input} value={p.cycle ?? "/mois"} onChange={(e) => upd({ cycle: e.target.value })}>
                        <option value="/mois">{t("pricing.cycle.monthly")}</option>
                        <option value="/an">{t("pricing.cycle.yearly")}</option>
                        <option value="">{t("pricing.cycle.oneTime")}</option>
                      </select>
                    </div>
                    <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={3} placeholder={t("pricing.featuresPlaceholder")} value={(p.features || []).join("\n")} onChange={(e) => upd({ features: e.target.value.split("\n").filter(Boolean) })} />
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input type="checkbox" checked={!!p.highlighted} onChange={(e) => upd({ highlighted: e.target.checked })} /> {t("pricing.highlightedLabel")}
                      </label>
                      <input className={input + " max-w-[200px]"} placeholder={t("pricing.ctaTextPlaceholder")} value={p.ctaText || ""} onChange={(e) => upd({ ctaText: e.target.value })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Témoignages */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">{t("testimonials.title")}</h2>
              <button onClick={() => setLocalized({ testimonials: [...testimonials, { name: "", role: "", company: "", text: "", rating: 5 }] })} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{t("testimonials.addButton")}</button>
            </div>
            <div className="space-y-4">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <input className={input} placeholder={t("testimonials.namePlaceholder")} value={testimonial.name} onChange={(e) => setLocalized({ testimonials: testimonials.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                    <input className={input} placeholder={t("testimonials.rolePlaceholder")} value={testimonial.role || ""} onChange={(e) => setLocalized({ testimonials: testimonials.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })} />
                    <input className={input} placeholder={t("testimonials.companyPlaceholder")} value={testimonial.company || ""} onChange={(e) => setLocalized({ testimonials: testimonials.map((x, j) => j === i ? { ...x, company: e.target.value } : x) })} />
                    <input className={input} type="number" min={1} max={5} placeholder={t("testimonials.ratingPlaceholder")} value={testimonial.rating || 5} onChange={(e) => setLocalized({ testimonials: testimonials.map((x, j) => j === i ? { ...x, rating: Number(e.target.value) } : x) })} />
                  </div>
                  <div className="flex items-center gap-2">
                    {testimonial.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={testimonial.avatar} alt="" className="h-9 w-9 rounded-full object-cover border" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold">{testimonial.name?.[0] || "?"}</div>
                    )}
                    <input className={input + " flex-1"} placeholder={t("testimonials.avatarPlaceholder")} value={testimonial.avatar || ""} onChange={(e) => setLocalized({ testimonials: testimonials.map((x, j) => j === i ? { ...x, avatar: e.target.value } : x) })} />
                    <label className={`shrink-0 cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 ${uploadingIdx === i ? "opacity-50" : ""}`}>
                      {uploadingIdx === i ? t("testimonials.uploading") : t("testimonials.upload")}
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
                            setLocalized({ testimonials: testimonials.map((x, j) => (j === i ? { ...x, avatar: url } : x)) });
                            addToast("success", t("testimonials.photoAddedTitle"));
                          } catch {
                            addToast("error", t("testimonials.photoUploadErrorTitle"), t("testimonials.photoUploadErrorMessage"));
                          } finally {
                            setUploadingIdx(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <textarea className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" rows={2} placeholder={t("testimonials.textPlaceholder")} value={testimonial.text} onChange={(e) => setLocalized({ testimonials: testimonials.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
                    <button onClick={() => setLocalized({ testimonials: testimonials.filter((_, j) => j !== i) })} className="h-9 px-3 self-start rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partenaires */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white">{t("partners.title")}</h2>
              <button onClick={() => setLocalized({ partners: [...partners, { name: "", logoUrl: "" }] })} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{t("partners.addButton")}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partners.map((p, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" className="h-10 w-20 rounded object-contain border bg-white" />
                    ) : (
                      <div className="h-10 w-20 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">{t("identity.logoPlaceholder")}</div>
                    )}
                    <label className={`shrink-0 cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 ${partnerUploadingIdx === i ? "opacity-50" : ""}`}>
                      {partnerUploadingIdx === i ? t("partners.uploading") : t("partners.upload")}
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
                            setLocalized({ partners: partners.map((x, j) => (j === i ? { ...x, logoUrl: url } : x)) });
                            addToast("success", t("partners.logoAddedTitle"));
                          } catch {
                            addToast("error", t("partners.logoUploadErrorTitle"), t("partners.logoUploadErrorMessage"));
                          } finally {
                            setPartnerUploadingIdx(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    <button onClick={() => setLocalized({ partners: partners.filter((_, j) => j !== i) })} className="ms-auto h-9 px-3 rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                  </div>
                  <input className={input} placeholder={t("partners.namePlaceholder")} value={p.name || ""} onChange={(e) => setLocalized({ partners: partners.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                </div>
              ))}
              {partners.length === 0 && (
                <p className="text-sm text-gray-400 italic col-span-full">{t("partners.emptyState")}</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className={card}>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">{t("contact.title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className={input} placeholder={t("contact.emailPlaceholder")} value={localized.contact?.email || ""} onChange={(e) => setContact("email", e.target.value)} />
              <input className={input} placeholder={t("contact.phonePlaceholder")} value={localized.contact?.phone || ""} onChange={(e) => setContact("phone", e.target.value)} />
              <input className={input} placeholder={t("contact.addressPlaceholder")} value={localized.contact?.address || ""} onChange={(e) => setContact("address", e.target.value)} />
              <input className={input} placeholder={t("contact.linkedinPlaceholder")} value={localized.contact?.linkedin || ""} onChange={(e) => setContact("linkedin", e.target.value)} />
              <input className={input} placeholder={t("contact.instagramPlaceholder")} value={localized.contact?.instagram || ""} onChange={(e) => setContact("instagram", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
          </div>
        </div>
      ) : (
        /* Messages de contact */
        <div className={card}>
          {!messages || messages.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{t("messages.emptyState")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {messages.data.map((m) => (
                <li key={m.id} className={`py-4 ${!m.is_read ? "" : "opacity-70"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {m.name} <span className="font-normal text-gray-400">· {m.email}</span>
                        {m.phone && <span className="font-normal text-gray-400"> · ☎ {m.phone}</span>}
                        {!m.is_read && <span className="ms-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{t("messages.newBadge")}</span>}
                      </p>
                      {m.subject && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{m.subject}</p>}
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{m.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                    {!m.is_read && (
                      <button onClick={() => markRead(m.id)} className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-700">{t("messages.markRead")}</button>
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

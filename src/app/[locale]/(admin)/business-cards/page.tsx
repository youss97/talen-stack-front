"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useGetBusinessCardsQuery,
  useCreateBusinessCardMutation,
  useUpdateBusinessCardMutation,
  useDeleteBusinessCardMutation,
  type BusinessCard,
} from "@/lib/services/businessCardApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const OWNER_TYPES = ["RH", "Client", "Employé"];
const OWNER_TYPE_LABEL_KEYS: Record<string, string> = { RH: "rh", Client: "client", "Employé": "employee" };
const TEMPLATES = ["snow", "dark", "brand", "gradient", "mint"];

type CustomField = { type: string; label: string; value: string };
type Form = Partial<BusinessCard> & { linkedin?: string; website?: string; custom_fields?: CustomField[]; template?: string };

export default function BusinessCardsPage() {
  const t = useTranslations("businessCards");
  const tc = useTranslations("common");
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: cards, isLoading } = useGetBusinessCardsQuery();
  const [createCard, { isLoading: creating }] = useCreateBusinessCardMutation();
  const [updateCard, { isLoading: updating }] = useUpdateBusinessCardMutation();
  const [deleteCard] = useDeleteBusinessCardMutation();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessCard | null>(null);
  const [form, setForm] = useState<Form>({ owner_type: "RH", custom_fields: [], template: "snow" });
  const [qrCard, setQrCard] = useState<BusinessCard | null>(null);
  const [cardImageUrl, setCardImageUrl] = useState("");
  const company = (user as unknown as { company?: { public_brand_color?: string; logo_path?: string; name?: string } } | null)?.company;
  const brandColor = company?.public_brand_color || "#8AB925";
  const companyLogo = company?.logo_path;
  const companyName = company?.name;

  const addToast = (variant: ToastItem["variant"], title: string, message?: string) =>
    setToasts((p) => [...p, { id: Date.now().toString(), variant, title, message }]);
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  // Pré-remplissage depuis le profil de l'utilisateur connecté
  const prefillFromProfile = (): Form => {
    const u = user as unknown as Record<string, unknown> | null;
    const company = (u?.company || {}) as Record<string, unknown>;
    return {
      owner_type: "RH",
      full_name: u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : "",
      position: (u?.position as string) || "",
      company_label: (company?.name as string) || "",
      email: (u?.email as string) || "",
      phone: (u?.phone as string) || "",
      photo_url: (u?.image as string) || (u?.photo_path as string) || "",
      linkedin: (u?.linkedin as string) || "",
      website: "",
      custom_fields: [],
      template: "snow",
    };
  };

  const openMyCard = () => { setEditing(null); setForm(prefillFromProfile()); setOpen(true); };
  const openEdit = (c: BusinessCard) => {
    setEditing(c);
    setForm({ ...c, linkedin: c.socials?.linkedin || "", website: c.socials?.website || "", custom_fields: c.custom_fields || [], template: c.branding?.template || "snow" });
    setOpen(true);
  };

  const srcUrl = (p?: string) => (p ? (p.startsWith("http") ? p : `${API}/${p}`) : "");
  const loadImg = (s: string, cross?: boolean): Promise<HTMLImageElement> =>
    new Promise((res, rej) => { const i = new Image(); if (cross) i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = s; });

  const shadeHex = (hex: string, percent: number): string => {
    const h = (hex || "").replace("#", "");
    if (h.length !== 6) return hex;
    const num = parseInt(h, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent)));
    const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /** Compose une carte de visite LUXUEUSE centrée sur le QR (logo société au centre) */
  const composeCard = async (card: BusinessCard, withLogo: boolean): Promise<string> => {
    const W = 1000, H = 600;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Fond : dégradé sombre élégant dérivé de la couleur de marque
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, shadeHex(brandColor, -0.6));
    g.addColorStop(1, shadeHex(brandColor, -0.25));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Liseré fin couleur de marque
    ctx.strokeStyle = brandColor; ctx.lineWidth = 3; ctx.strokeRect(18, 18, W - 36, H - 36);

    // Nom de la société en haut
    ctx.textAlign = "center";
    if (companyName) {
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = "600 28px sans-serif";
      ctx.fillText(companyName, W / 2, 78);
    }

    // QR au centre sur pastille blanche
    const qs = 300, pad = 26;
    const px = (W - qs) / 2, py = (H - qs) / 2 - 6;
    ctx.save(); roundRect(ctx, px - pad, py - pad, qs + pad * 2, qs + pad * 2, 28); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.restore();
    const url = `${window.location.origin}/card/${card.id}`;
    const qrUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: "H", width: 600, margin: 1 });
    const qrImg = await loadImg(qrUrl);
    ctx.drawImage(qrImg, px, py, qs, qs);

    // Logo société au centre du QR
    if (withLogo && companyLogo) {
      try {
        const lg = await loadImg(srcUrl(companyLogo), true);
        const ls = Math.round(qs * 0.22);
        const lx = W / 2 - ls / 2, ly = py + qs / 2 - ls / 2;
        ctx.save(); roundRect(ctx, lx - 10, ly - 10, ls + 20, ls + 20, 12); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.restore();
        ctx.drawImage(lg, lx, ly, ls, ls);
      } catch { /* QR sans logo si CORS */ }
    }

    // Nom de la personne en bas (discret)
    if (card.full_name) {
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 30px sans-serif";
      ctx.fillText(card.full_name, W / 2, H - 64);
    }
    if (card.position) {
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "19px sans-serif";
      ctx.fillText(card.position, W / 2, H - 36);
    }

    try { return canvas.toDataURL("image/png"); }
    catch { return withLogo ? composeCard(card, false) : ""; }
  };

  useEffect(() => {
    if (qrCard && typeof window !== "undefined") {
      setCardImageUrl("");
      composeCard(qrCard, true).then(setCardImageUrl).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCard]);

  const downloadQR = () => {
    if (!cardImageUrl) return;
    const a = document.createElement("a");
    a.href = cardImageUrl;
    a.download = `${t("qrModal.fileNamePrefix")}-${(qrCard?.full_name || t("qrModal.fileNamePrefix")).replace(/\s+/g, "_")}.png`;
    a.click();
  };
  const printQR = () => {
    if (!cardImageUrl) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${t("qrModal.printTitle", { name: qrCard?.full_name || "" })}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh"><img src="${cardImageUrl}" style="max-width:100%"/><script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  const setCustom = (i: number, patch: Partial<CustomField>) =>
    setForm((f) => ({ ...f, custom_fields: (f.custom_fields || []).map((cf, idx) => (idx === i ? { ...cf, ...patch } : cf)) }));
  const addCustom = () => setForm((f) => ({ ...f, custom_fields: [...(f.custom_fields || []), { type: "link", label: "", value: "" }] }));
  const removeCustom = (i: number) => setForm((f) => ({ ...f, custom_fields: (f.custom_fields || []).filter((_, idx) => idx !== i) }));

  const submit = async () => {
    const payload: Partial<BusinessCard> = {
      owner_type: form.owner_type || "RH",
      full_name: form.full_name || "",
      position: form.position,
      company_label: form.company_label,
      email: form.email,
      phone: form.phone,
      photo_url: form.photo_url,
      socials: { ...(form.linkedin ? { linkedin: form.linkedin } : {}), ...(form.website ? { website: form.website } : {}) },
      custom_fields: (form.custom_fields || []).filter((cf) => cf.label || cf.value),
      branding: { ...(editing?.branding || {}), template: form.template || "snow" },
    };
    try {
      if (editing) await updateCard({ id: editing.id, data: payload }).unwrap();
      else await createCard(payload).unwrap();
      addToast("success", tc("status.success"), editing ? t("toasts.cardUpdated") : t("toasts.cardCreated"));
      setOpen(false);
    } catch (err) {
      addToast("error", tc("status.error"), getApiErrorMessage(err, t("toasts.saveError")));
    }
  };

  const toggleActive = async (c: BusinessCard) => {
    try { await updateCard({ id: c.id, data: { is_active: !c.is_active } }).unwrap(); } catch { /* */ }
  };
  const remove = async (c: BusinessCard) => {
    if (!confirm(t("confirmDelete", { name: c.full_name }))) return;
    try { await deleteCard(c.id).unwrap(); addToast("success", tc("status.success"), t("toasts.cardDeleted")); } catch { /* */ }
  };
  const copyLink = (c: BusinessCard) => {
    navigator.clipboard.writeText(`${window.location.origin}/card/${c.id}`);
    addToast("success", t("toasts.linkCopied"), t("toasts.linkCopiedMessage"));
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <a href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <span className="inline-block rtl:rotate-180">←</span> {t("backToSettings")}
      </a>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">{t("title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
          </div>
          <Button onClick={openMyCard}>{t("createMyCard")}</Button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>
          ) : (cards || []).length === 0 ? (
            <p className="text-sm text-gray-500">{t("noCards")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cards || []).map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t(`ownerTypes.${OWNER_TYPE_LABEL_KEYS[c.owner_type] || "rh"}`)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>{c.is_active ? t("card.active") : t("card.inactive")}</span>
                  </div>
                  <p className="mt-2 font-semibold text-gray-800 dark:text-white">{c.full_name}</p>
                  {c.position && <p className="text-sm text-gray-500">{c.position}</p>}
                  {c.email && <p className="text-xs text-gray-400 mt-1">{c.email}</p>}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button onClick={() => { setCardImageUrl(""); setQrCard(c); }} className="col-span-3 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">{t("card.qrAndCard")}</button>
                    <a href={`/card/${c.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors">{t("card.preview")}</a>
                    <button onClick={() => copyLink(c)} className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors">{t("card.link")}</button>
                    <button onClick={() => openEdit(c)} className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors">{tc("actions.edit")}</button>
                    <button onClick={() => toggleActive(c)} className="col-span-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300">{c.is_active ? t("card.deactivate") : t("card.activate")}</button>
                    <button onClick={() => remove(c)} className="rounded-lg px-3 py-2 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-300">{tc("actions.delete")}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-lg">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{editing ? t("form.editTitle") : t("form.createTitle")}</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {form.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo_url} alt="" className="h-16 w-16 rounded-full object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-semibold">
                  {(form.full_name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-400">{t("form.photoFromProfile")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.owner_type} onChange={(e) => setForm({ ...form, owner_type: e.target.value })} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700">
                {OWNER_TYPES.map((ot) => <option key={ot} value={ot}>{t(`ownerTypes.${OWNER_TYPE_LABEL_KEYS[ot]}`)}</option>)}
              </select>
              <select value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700">
                {TEMPLATES.map((tpl) => <option key={tpl} value={tpl}>{t(`templates.${tpl}`)}</option>)}
              </select>
            </div>
            <input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder={t("form.fullNamePlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder={t("form.positionPlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.company_label || ""} onChange={(e) => setForm({ ...form, company_label: e.target.value })} placeholder={t("form.companyPlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={tc("labels.email")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("form.phonePlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.linkedin || ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder={t("form.linkedinPlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder={t("form.websitePlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />

            {/* Champs personnalisés */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("form.customFieldsLabel")}</span>
                <button type="button" onClick={addCustom} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{t("form.addField")}</button>
              </div>
              <div className="space-y-2">
                {(form.custom_fields || []).map((cf, i) => (
                  <div key={i} className="flex gap-2">
                    <select value={cf.type} onChange={(e) => setCustom(i, { type: e.target.value })} className="h-9 w-20 rounded-lg border border-gray-300 px-2 text-xs dark:bg-gray-900 dark:border-gray-700">
                      <option value="link">{t("form.typeLink")}</option>
                      <option value="text">{t("form.typeText")}</option>
                    </select>
                    <input value={cf.label} onChange={(e) => setCustom(i, { label: e.target.value })} placeholder={t("form.labelPlaceholder")} className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-xs dark:bg-gray-900 dark:border-gray-700" />
                    <input value={cf.value} onChange={(e) => setCustom(i, { value: e.target.value })} placeholder={cf.type === "link" ? t("form.urlPlaceholder") : t("form.valuePlaceholder")} className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-xs dark:bg-gray-900 dark:border-gray-700" />
                    <button type="button" onClick={() => removeCustom(i)} className="h-9 px-2 rounded-lg border border-error-300 text-error-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setOpen(false)}>{tc("actions.cancel")}</Button>
            <Button onClick={submit} disabled={creating || updating || !form.full_name}>{creating || updating ? t("form.saving") : tc("actions.save")}</Button>
          </div>
        </div>
      </Modal>

      {/* Modale carte + QR — à partager / imprimer */}
      <Modal isOpen={!!qrCard} onClose={() => setQrCard(null)} className="max-w-xl">
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t("qrModal.title")}</h2>
          <p className="text-sm text-gray-500 mb-4">{qrCard?.full_name}</p>
          <div className="flex justify-center min-h-[180px] items-center">
            {cardImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cardImageUrl} alt={t("qrModal.altText")} className="w-full max-w-md rounded-xl border border-gray-100 shadow-sm" />
            ) : (
              <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
            )}
          </div>
          <p className="mt-3 text-xs text-gray-400">{t("qrModal.scanHint")}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" onClick={printQR} disabled={!cardImageUrl}>{t("qrModal.print")}</Button>
            <Button onClick={downloadQR} disabled={!cardImageUrl}>{t("qrModal.download")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

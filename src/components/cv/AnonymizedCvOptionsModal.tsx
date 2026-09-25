"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Download, ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useGetCVByIdQuery } from "@/lib/services/cvApi";
import {
  fetchAnonymizedSections,
  fetchCustomAnonymizedCvBlobUrl,
  type AnonymizedCvPayload,
} from "@/utils/cvView";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cvId: string;
  /** Valeurs actuelles du CV, pour pré-remplir les champs modifiables */
  initialTitle?: string;
  initialSummary?: string;
  initialSkills?: string[];
  initialExperiences?: any[];
  initialFormations?: any[];
}

interface ExpRow {
  title: string; company: string; location: string; start_date: string; end_date: string; description: string;
}

interface FormRow {
  degree: string; field: string; institution: string; start_date: string; end_date: string;
}

const htmlToText = (value: unknown) =>
  String(value ?? "")
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const toExpRow = (e: any): ExpRow => ({
  title: e?.title || e?.poste || "", company: e?.company || e?.entreprise || "", location: e?.location || "",
  start_date: e?.start_date || "", end_date: e?.end_date || "", description: htmlToText(e?.description),
});

const toFormRow = (f: any): FormRow => ({
  degree: f?.degree || f?.diplome || "", field: f?.field || f?.domaine || "", institution: f?.institution || f?.etablissement || "",
  start_date: f?.start_date || "", end_date: f?.end_date || "",
});

interface Row {
  key: string; // section standard ou "block:<id>"
  checked: boolean;
}

interface Block {
  id: string;
  title: string;
  text: string;
}

const newId = () => Math.random().toString(36).slice(2, 9);

/**
 * Éditeur du CV anonymisé : aperçu PDF en direct, choix/ordre des sections (glisser-déposer),
 * champs modifiables et blocs libres. Les modifications ne touchent pas la fiche du candidat :
 * elles ne s'appliquent qu'au PDF généré ici.
 */
export default function AnonymizedCvOptionsModal({
  isOpen, onClose, cvId, initialTitle, initialSummary, initialSkills, initialExperiences, initialFormations,
}: Props) {
  const t = useTranslations("cvs.anonymizedOptions");

  // Le CV est toujours chargé ici (ligne sous le titre, et valeurs par défaut si non fournies)
  const needsFetch = initialExperiences === undefined && initialFormations === undefined;
  const { data: fetchedCv, isFetching: isFetchingCv } = useGetCVByIdQuery(cvId, { skip: !isOpen });
  const initial = useMemo(() => {
    const cv: any = fetchedCv || {};
    const extraction = cv.full_information?.extraction || {};
    const years = cv.total_experience ?? extraction.experience_years;
    const quickFacts = years != null && years !== "" ? `${years} an${Number(years) > 1 ? "s" : ""} d'expérience` : "";
    if (!needsFetch) {
      return {
        title: initialTitle || "", summary: initialSummary || "", skills: initialSkills || [],
        experiences: initialExperiences || [], formations: initialFormations || [], quickFacts,
      };
    }
    return {
      title: cv.profile_title || cv.last_position || "",
      summary: htmlToText(cv.full_information?.summary || extraction.summary || ""),
      skills: (cv.skills?.length ? cv.skills : extraction.skills) || [],
      experiences: (cv.experiences?.length ? cv.experiences : extraction.experiences) || [],
      formations: (cv.formations?.length ? cv.formations : extraction.formations) || [],
      quickFacts,
    };
  }, [needsFetch, fetchedCv, initialTitle, initialSummary, initialSkills, initialExperiences, initialFormations]);
  const [quickFacts, setQuickFacts] = useState("");
  const [pdfFilename, setPdfFilename] = useState("cv-anonymise.pdf");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [rows, setRows] = useState<Row[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [experiences, setExperiences] = useState<ExpRow[]>([]);
  const [formations, setFormations] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessage(null);
    if (isFetchingCv) return; // attend le chargement du CV
    setMobileTab("edit");
    setQuickFacts(initial.quickFacts);
    setTitle(initial.title);
    setSummary(initial.summary);
    setSkillsText(initial.skills.join(", "));
    setExperiences(initial.experiences.map(toExpRow));
    setFormations(initial.formations.map(toFormRow));
    setBlocks([]);
    setLoading(true);
    fetchAnonymizedSections().then((data) => {
      if (data) {
        const rest = data.available.filter((k) => !data.sections.includes(k));
        setRows([...data.sections.map((key) => ({ key, checked: true })), ...rest.map((key) => ({ key, checked: false }))]);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cvId, fetchedCv, isFetchingCv]);

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  // Payload envoyé au serveur : les blocs libres sont indexés dans l'ordre d'apparition
  const payload: AnonymizedCvPayload = useMemo(() => {
    const blockOrder = rows.filter((r) => r.checked && r.key.startsWith("block:")).map((r) => r.key.slice(6));
    const usedBlocks = blockOrder.map((id) => blocks.find((b) => b.id === id)).filter(Boolean) as Block[];
    const sections = rows
      .filter((r) => r.checked)
      .map((r) => (r.key.startsWith("block:") ? `custom:${blockOrder.indexOf(r.key.slice(6))}` : r.key));
    const skills = skillsText.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    return {
      sections,
      overrides: {
        profileTitle: title.trim() || undefined,
        summary: summary.trim() || undefined,
        skills: skills.length ? skills : undefined,
        quickFacts,
        experiences,
        formations,
        customBlocks: usedBlocks.map((b) => ({ title: b.title, text: b.text })),
      },
    };
  }, [rows, blocks, title, summary, skillsText, quickFacts, experiences, formations]);

  const payloadKey = JSON.stringify(payload);

  // Aperçu régénéré (avec délai) à chaque modification
  useEffect(() => {
    if (!isOpen || loading || payload.sections.length === 0) return;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      const result = await fetchCustomAnonymizedCvBlobUrl(cvId, payload);
      setPreviewLoading(false);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = result?.url ?? null;
      setPreviewUrl(result?.url ?? null);
      if (result) setPdfFilename(result.filename);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, isOpen, loading]);

  const move = (index: number, delta: number) => {
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const dropOn = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    setRows((prev) => {
      const from = prev.findIndex((r) => r.key === dragKey);
      const to = prev.findIndex((r) => r.key === targetKey);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragKey(null);
  };

  const addBlock = () => {
    const id = newId();
    setBlocks((prev) => [...prev, { id, title: "", text: "" }]);
    setRows((prev) => [...prev, { key: `block:${id}`, checked: true }]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setRows((prev) => prev.filter((r) => r.key !== `block:${id}`));
  };

  const updateBlock = (id: string, patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  // Téléchargement volontaire du PDF tel qu'affiché dans l'aperçu (avec les modifications)
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = pdfFilename;
    a.click();
  };

  const sectionLabel = (key: string) => {
    if (key.startsWith("block:")) {
      const block = blocks.find((b) => b.id === key.slice(6));
      return block?.title?.trim() || t("customBlock");
    }
    return t(`sections.${key}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[96vw] w-[96vw]">
      <div className="max-h-[94vh] overflow-y-auto p-3 sm:p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t("title")}</h2>
        <p className="mt-1 mb-3 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>

        {/* Petit écran : un seul panneau à la fois (Édition | Aperçu) ; grand écran : les deux côte à côte */}
        <div className="mb-3 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-900 lg:hidden">
          {(["edit", "preview"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mobileTab === tab ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400" : "text-gray-500"
              }`}
            >
              {t(tab === "edit" ? "tabEdit" : "tabPreview")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* ── Édition ── */}
          <div className={`${mobileTab === "edit" ? "block" : "hidden"} lg:block max-h-[80vh] space-y-5 overflow-y-auto pe-1 custom-scrollbar`}>
            <div>
              <Label>{t("fields.title")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.quickFacts")}</Label>
              <Input value={quickFacts} onChange={(e) => setQuickFacts(e.target.value)} placeholder={t("fields.quickFactsPlaceholder")} />
            </div>
            <div>
              <Label>{t("fields.summary")}</Label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
            </div>
            <div>
              <Label>{t("fields.skills")}</Label>
              <textarea
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
              <p className="mt-1 text-xs text-gray-400">{t("fields.skillsHint")}</p>
            </div>

            <div>
              <Label>{t("fields.experiences")}</Label>
              <div className="space-y-3">
                {experiences.map((exp, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input placeholder={t("fields.jobTitle")} value={exp.title} onChange={(e) => setExperiences((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <Input placeholder={t("fields.company")} value={exp.company} onChange={(e) => setExperiences((p) => p.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))} />
                      <Input placeholder={t("fields.startDate")} value={exp.start_date} onChange={(e) => setExperiences((p) => p.map((x, j) => (j === i ? { ...x, start_date: e.target.value } : x)))} />
                      <Input placeholder={t("fields.endDate")} value={exp.end_date} onChange={(e) => setExperiences((p) => p.map((x, j) => (j === i ? { ...x, end_date: e.target.value } : x)))} />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => setExperiences((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                      rows={3}
                      placeholder={t("fields.description")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                    <button type="button" onClick={() => setExperiences((p) => p.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-error-500">
                      <Trash2 size={13} /> {t("fields.removeEntry")}
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setExperiences((p) => [...p, { title: "", company: "", location: "", start_date: "", end_date: "", description: "" }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={15} strokeWidth={1.8} /> {t("fields.addExperience")}
              </button>
            </div>

            <div>
              <Label>{t("fields.formations")}</Label>
              <div className="space-y-3">
                {formations.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input placeholder={t("fields.degree")} value={f.degree} onChange={(e) => setFormations((p) => p.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x)))} />
                      <Input placeholder={t("fields.field")} value={f.field} onChange={(e) => setFormations((p) => p.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} />
                      <Input placeholder={t("fields.institution")} value={f.institution} onChange={(e) => setFormations((p) => p.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x)))} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input placeholder={t("fields.startDate")} value={f.start_date} onChange={(e) => setFormations((p) => p.map((x, j) => (j === i ? { ...x, start_date: e.target.value } : x)))} />
                        <Input placeholder={t("fields.endDate")} value={f.end_date} onChange={(e) => setFormations((p) => p.map((x, j) => (j === i ? { ...x, end_date: e.target.value } : x)))} />
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormations((p) => p.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-error-500">
                      <Trash2 size={13} /> {t("fields.removeEntry")}
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setFormations((p) => [...p, { degree: "", field: "", institution: "", start_date: "", end_date: "" }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={15} strokeWidth={1.8} /> {t("fields.addFormation")}
              </button>
            </div>

            <div>
              <Label>{t("orderLabel")}</Label>
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {rows.map((row, index) => (
                    <li
                      key={row.key}
                      draggable
                      onDragStart={() => setDragKey(row.key)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dropOn(row.key)}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                        row.checked ? "border-gray-200 dark:border-gray-700" : "border-dashed border-gray-200 dark:border-gray-800 opacity-60"
                      }`}
                    >
                      <GripVertical size={16} className="text-gray-400 cursor-grab shrink-0" />
                      <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={() => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, checked: !r.checked } : r)))}
                          className="w-4 h-4"
                        />
                        <span className="truncate text-gray-800 dark:text-gray-200">{sectionLabel(row.key)}</span>
                      </label>
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowDown size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Label>{t("customBlocks.label")}</Label>
              <div className="space-y-3">
                {blocks.map((block) => (
                  <div key={block.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder={t("customBlocks.titlePlaceholder")} value={block.title} onChange={(e) => updateBlock(block.id, { title: e.target.value })} />
                      <button type="button" onClick={() => removeBlock(block.id)} title={t("customBlocks.remove")} className="shrink-0 p-2 text-gray-400 hover:text-error-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <textarea
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      rows={3}
                      placeholder={t("customBlocks.textPlaceholder")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addBlock} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={15} strokeWidth={1.8} /> {t("customBlocks.add")}
              </button>
            </div>

            <p className="text-xs text-gray-400">{t("privacyNote")}</p>
            <p className="text-xs text-gray-400">{t("editNote")}</p>
          </div>

          {/* ── Aperçu ── */}
          <div className={`${mobileTab === "preview" ? "block" : "hidden"} lg:block relative h-[75vh] lg:h-[80vh] overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800`}>
            {previewUrl ? (
              // Pages seules, en grand : barre d'outils et vignettes du lecteur PDF masquées, largeur de page ajustée
              <iframe key={previewUrl} src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`} title={t("previewTitle")} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">{t("previewLoading")}</div>
            )}
            {previewLoading && previewUrl && (
              <div className="absolute end-3 top-3 h-3 w-3 animate-pulse rounded-full bg-brand-500" title={t("previewLoading")} />
            )}
          </div>
        </div>

        {message && <p className={`mt-3 text-sm ${message.kind === "ok" ? "text-success-600" : "text-error-500"}`}>{message.text}</p>}

        <div className="mt-4 flex justify-end">
          <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            <Button variant="outline" onClick={onClose}>{t("close")}</Button>
            <Button variant="outline" onClick={() => previewUrl && window.open(previewUrl, "_blank")} disabled={!previewUrl} startIcon={<ExternalLink size={15} strokeWidth={1.8} />}>
              {t("openInTab")}
            </Button>
            <Button onClick={handleDownload} disabled={!previewUrl || previewLoading} startIcon={<Download size={15} strokeWidth={1.8} />}>
              {t("download")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


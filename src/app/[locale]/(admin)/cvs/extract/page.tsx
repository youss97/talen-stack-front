"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Upload, FileText, Plus, X, RefreshCw, Lock } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useCreateCVMutation,
  useUpdateCVMutation,
  useLazyGetCVByIdQuery,
  useExtractCVMutation,
} from "@/lib/services/cvApi";
import { useGetCvSourcesQuery } from "@/lib/services/cvSourceApi";
import type { CvExperience, CvFormation } from "@/types/cv";
import MonthYearPicker from "@/components/form/MonthYearPicker";
import YearPicker from "@/components/form/YearPicker";
import RichTextEditor from "@/components/form/RichTextEditor";
import { openCvInNewTab } from "@/utils/cvView";

const LANGUAGE_LEVELS = ["Natif", "Courant", "Avancé", "Intermédiaire", "Notions"] as const;
const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance", "Intérim"] as const;
const STATUS_VALUES = ["new", "reviewed", "shortlisted", "interviewed", "hired", "rejected", "archived"] as const;

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:focus:border-brand-800";

const sectionHeadClass =
  "flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700";

const stepBadge =
  "inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-xs font-bold";

// ── Empty factories ───────────────────────────────────────────────────────────
const emptyExp = (): CvExperience => ({
  company: "", title: "", start_date: "", end_date: "", location: "", description: "",
});
const emptyForm = (): CvFormation => ({
  institution: "", degree: "", field: "", start_date: "", end_date: "",
});

export default function CVExtractPage() {
  const t = useTranslations("cvs.extract");
  const tStatus = useTranslations("cvs.status");
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("id");
  const isEditing = !!cvId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [profileTitle, setProfileTitle] = useState(""); // Intitulé du CV (métier/titre)
  const [totalExperience, setTotalExperience] = useState<string>("");
  const [industry, setIndustry] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("new");
  const [source, setSource] = useState("");
  const [remotePreferred, setRemotePreferred] = useState(false);

  // Tags-based fields
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certificationInput, setCertificationInput] = useState("");
  const [languages, setLanguages] = useState<{ name: string; level: string }[]>([]);
  const [langName, setLangName] = useState("");
  const [langLevel, setLangLevel] = useState<string>("Courant");
  const [mobility, setMobility] = useState<string[]>([]);
  const [mobilityInput, setMobilityInput] = useState("");
  const [contractTypes, setContractTypes] = useState<string[]>([]);

  // Structured lists
  const [experiences, setExperiences] = useState<CvExperience[]>([emptyExp()]);
  const [formations, setFormations] = useState<CvFormation[]>([emptyForm()]);

  const [getCVById, { isLoading: isLoadingCV }] = useLazyGetCVByIdQuery();
  const [createCV, { isLoading: isCreating }] = useCreateCVMutation();
  const [updateCV, { isLoading: isUpdating }] = useUpdateCVMutation();
  const { data: cvSourcesData } = useGetCvSourcesQuery({ is_active: true });
  const cvSources = cvSourcesData?.data || [];
  const [extractCV] = useExtractCVMutation();

  const addToast = useCallback(
    (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Load existing CV ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!cvId) return;
    getCVById(cvId)
      .unwrap()
      .then((cv) => {
        setFirstName(cv.candidate_first_name || "");
        setLastName(cv.candidate_last_name || "");
        setEmail(cv.candidate_email || "");
        setPhone(cv.candidate_phone || "");
        setLinkedinUrl(cv.linkedin_url || "");
        setPortfolioUrl(cv.portfolio_url || "");
        setInternalNote(cv.internal_note || "");
        setProfileTitle(cv.profile_title || cv.last_position || "");
        setTotalExperience(cv.total_experience != null ? String(cv.total_experience) : "");
        setIndustry(cv.industry_experience || "");
        setSpecialty(cv.specialty || "");
        setLocation((cv as any).location || "");
        setSoftSkills((cv as any).soft_skills || []);
        setCertifications((cv as any).certifications || []);
        setSummary((cv.full_information as any)?.summary || "");
        setStatus(cv.status || "new");
        setSource((cv as any).source || "");
        setRemotePreferred(cv.remote_preferred || false);
        setSkills(cv.skills || cv.additional_skills || []);
        setMobility(cv.geographic_mobility || []);
        setContractTypes(cv.contract_type_preferences || []);

        // Languages: stored as ["Français (natif)", "Anglais (courant)"]
        const rawLangs = (cv as any).languages || [];
        setLanguages(rawLangs.map((l: string) => {
          const match = l.match(/^(.+?)\s*\((.+)\)$/);
          return match
            ? { name: match[1].trim(), level: match[2].trim() }
            : { name: l, level: "Courant" };
        }));

        // Experiences / formations
        const exps: CvExperience[] = (cv as any).experiences || [];
        setExperiences(exps.length ? exps : [emptyExp()]);
        const forms: CvFormation[] = (cv as any).formations || [];
        setFormations(forms.length ? forms : [emptyForm()]);

        if (cv.file_path || (cv as any).cloudinary_url) {
          setPreviewUrl((cv as any).cloudinary_url || cv.file_path as string);
        }
      })
      .catch(() => addToast("error", t("toasts.loadCvErrorTitle"), t("toasts.loadCvErrorMessage")));
  }, [cvId, getCVById, addToast]);

  // ── File upload + extraction ──────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    await extractCVData(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  // noClick/noKeyboard : le clic reste géré par le <input> caché existant (fileInputRef),
  // réutilisé aussi par le bouton "Remplacer le fichier" en mode édition — le dropzone
  // n'ajoute que la gestion du glisser-déposer par-dessus la même zone.
  const { getRootProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "application/rtf": [".rtf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) handleFile(file);
    },
    onDropRejected: (fileRejections: FileRejection[]) => {
      addToast(
        "error",
        t("toasts.invalidFileTitle"),
        fileRejections[0]?.errors[0]?.message || t("toasts.unsupportedFormat")
      );
    },
  });

  const extractCVData = async (file: File) => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await extractCV(formData).unwrap();
      const data = response.extracted_data || response;

      // Identité
      if (data.name && data.name !== "Non spécifié") {
        const parts = data.name.trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
      if (data.current_position && data.current_position !== "Non spécifié") {
        const cp = data.current_position;
        setProfileTitle((prev) => prev || cp);
      }
      if (data.experience_years) setTotalExperience(String(data.experience_years));
      if (data.industry && data.industry !== "Non spécifié") setIndustry(data.industry);
      if (data.summary && data.summary !== "Non spécifié" && data.summary !== "Aucun résumé disponible") setSummary(data.summary);

      // Skills
      if (Array.isArray(data.skills) && data.skills.length > 0) setSkills(data.skills);

      // Languages
      if (Array.isArray(data.languages) && data.languages.length > 0) {
        setLanguages(data.languages.map((l: string) => {
          const match = l.match(/^(.+?)\s*\((.+)\)$/);
          return match
            ? { name: match[1].trim(), level: match[2].trim() }
            : { name: l, level: "Courant" };
        }));
      }

      // Mobility
      if (Array.isArray(data.locations) && data.locations.length > 0) {
        setMobility(data.locations.filter((l: string) => l !== "Non spécifié"));
      }

      // Contract types
      if (Array.isArray(data.contract_type_preferences) && data.contract_type_preferences.length > 0) {
        setContractTypes(data.contract_type_preferences);
      }

      // Structured experiences
      if (Array.isArray(data.experiences) && data.experiences.length > 0) {
        setExperiences(data.experiences);
      }

      // Structured formations
      if (Array.isArray(data.formations) && data.formations.length > 0) {
        setFormations(data.formations);
      }

      addToast("success", t("toasts.extractSuccessTitle"), t("toasts.extractSuccessMessage"));
    } catch {
      addToast("error", t("toasts.extractErrorTitle"), t("toasts.extractErrorMessage"));
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Skills helpers ────────────────────────────────────────────────────────
  const addSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    // Support comma-separated input
    const items = val.split(",").map((s) => s.trim()).filter(Boolean);
    setSkills((prev) => [...new Set([...prev, ...items])]);
    setSkillInput("");
  };
  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  // ── Soft skills helpers ───────────────────────────────────────────────────
  const addSoftSkill = () => {
    const val = softSkillInput.trim();
    if (!val) return;
    const items = val.split(",").map((s) => s.trim()).filter(Boolean);
    setSoftSkills((prev) => [...new Set([...prev, ...items])]);
    setSoftSkillInput("");
  };
  const removeSoftSkill = (s: string) => setSoftSkills((prev) => prev.filter((x) => x !== s));

  // ── Certifications helpers ────────────────────────────────────────────────
  const addCertification = () => {
    const val = certificationInput.trim();
    if (!val) return;
    const items = val.split(",").map((s) => s.trim()).filter(Boolean);
    setCertifications((prev) => [...new Set([...prev, ...items])]);
    setCertificationInput("");
  };
  const removeCertification = (s: string) => setCertifications((prev) => prev.filter((x) => x !== s));

  // ── Language helpers ──────────────────────────────────────────────────────
  const addLanguage = () => {
    const name = langName.trim();
    if (!name) return;
    setLanguages((prev) => [...prev, { name, level: langLevel }]);
    setLangName("");
    setLangLevel("Courant");
  };
  const removeLanguage = (i: number) => setLanguages((prev) => prev.filter((_, idx) => idx !== i));

  // ── Mobility helpers ──────────────────────────────────────────────────────
  const addMobility = () => {
    const val = mobilityInput.trim();
    if (!val) return;
    const items = val.split(",").map((s) => s.trim()).filter(Boolean);
    setMobility((prev) => [...new Set([...prev, ...items])]);
    setMobilityInput("");
  };
  const removeMobility = (s: string) => setMobility((prev) => prev.filter((x) => x !== s));

  // ── Contract type toggle ──────────────────────────────────────────────────
  const toggleContract = (type: string) => {
    setContractTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
    );
  };

  // ── Experience helpers ────────────────────────────────────────────────────
  const updateExp = (i: number, field: keyof CvExperience, value: string) => {
    setExperiences((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };
  const addExp = () => setExperiences((prev) => [...prev, emptyExp()]);
  const removeExp = (i: number) => setExperiences((prev) => prev.filter((_, idx) => idx !== i));

  // ── Formation helpers ─────────────────────────────────────────────────────
  const updateForm = (i: number, field: keyof CvFormation, value: string) => {
    setFormations((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  };
  const addForm = () => setFormations((prev) => [...prev, emptyForm()]);
  const removeForm = (i: number) => setFormations((prev) => prev.filter((_, idx) => idx !== i));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && !selectedFile) {
      addToast("error", t("toasts.uploadRequiredTitle"), t("toasts.uploadRequiredMessage"));
      return;
    }

    // Validate required fields
    const missing: string[] = [];
    if (!firstName.trim()) missing.push(t("toasts.missingFirstName"));
    if (!lastName.trim()) missing.push(t("toasts.missingLastName"));
    if (!email.trim()) missing.push(t("toasts.missingEmail"));
    if (missing.length > 0) {
      addToast("error", t("toasts.missingFieldsTitle"), t("toasts.missingFieldsMessage", { fields: missing.join(", ") }));
      return;
    }

    // Build payload
    const cleanExperiences = experiences.filter((ex) => ex.company || ex.title);
    const cleanFormations = formations.filter((f) => f.institution || f.degree);
    const langStrings = languages.map((l) => `${l.name} (${l.level})`);

    try {
      if (isEditing && cvId) {
        const payload: Record<string, unknown> = {
          candidate_first_name: firstName,
          candidate_last_name: lastName,
          candidate_email: email,
          candidate_phone: phone,
          linkedin_url: linkedinUrl || undefined,
          portfolio_url: portfolioUrl || undefined,
          internal_note: internalNote || undefined,
          profile_title: profileTitle || undefined,
          summary: summary || undefined,
          total_experience: totalExperience ? Number(totalExperience) : undefined,
          industry_experience: industry,
          specialty: specialty || undefined,
          location: location || undefined,
          additional_skills: skills,
          soft_skills: softSkills,
          certifications,
          languages: langStrings,
          geographic_mobility: mobility,
          contract_type_preferences: contractTypes,
          remote_preferred: remotePreferred,
          status,
          source: source || undefined,
          experiences: cleanExperiences,
          formations: cleanFormations,
        };
        await updateCV({ id: cvId, data: payload }).unwrap();
        addToast("success", t("toasts.updateSuccessTitle"), t("toasts.updateSuccessMessage"));
      } else {
        const formData = new FormData();
        if (selectedFile) formData.append("file", selectedFile);

        formData.append("candidate_first_name", firstName);
        formData.append("candidate_last_name", lastName);
        formData.append("candidate_email", email);
        formData.append("candidate_phone", phone);
        if (linkedinUrl) formData.append("linkedin_url", linkedinUrl);
        if (portfolioUrl) formData.append("portfolio_url", portfolioUrl);
        if (internalNote) formData.append("internal_note", internalNote);
        if (profileTitle) formData.append("profile_title", profileTitle);
        if (summary) formData.append("summary", summary);
        if (totalExperience) formData.append("total_experience", totalExperience);
        formData.append("industry_experience", industry);
        if (specialty) formData.append("specialty", specialty);
        if (location) formData.append("location", location);
        formData.append("remote_preferred", String(remotePreferred));
        formData.append("status", status);
        if (source) formData.append("source", source);

        skills.forEach((s) => formData.append("additional_skills", s));
        softSkills.forEach((s) => formData.append("soft_skills", s));
        certifications.forEach((c) => formData.append("certifications", c));
        langStrings.forEach((l) => formData.append("languages", l));
        mobility.forEach((m) => formData.append("geographic_mobility", m));
        contractTypes.forEach((c) => formData.append("contract_type_preferences", c));

        if (cleanExperiences.length) {
          formData.append("experiences", JSON.stringify(cleanExperiences));
        }
        if (cleanFormations.length) {
          formData.append("formations", JSON.stringify(cleanFormations));
        }

        await createCV(formData).unwrap();
        addToast("success", t("toasts.updateSuccessTitle"), t("toasts.createSuccessMessage"));
      }

      setTimeout(() => router.push("/cvs"), 1200);
    } catch (err: unknown) {
      const errData = (err as { data?: { message?: string | string[]; error?: string; statusCode?: number } })?.data;
      let msg: string;
      if (Array.isArray(errData?.message)) {
        msg = errData.message.join(". ");
      } else if (errData?.message) {
        msg = errData.message;
      } else if (errData?.error) {
        msg = errData.error === "Conflict"
          ? t("toasts.conflictError")
          : errData.error === "Bad Request"
          ? t("toasts.badRequestError")
          : errData.error;
      } else {
        msg = isEditing
          ? t("toasts.updateGenericError")
          : t("toasts.createGenericError");
      }
      addToast("error", t("toasts.errorTitle"), msg);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="max-w-5xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Back */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/cvs")} startIcon={<ArrowLeftIcon />}>
          {t("backButton")}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. Document ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>1</span>
            {t("steps.document")}
          </h3>

          {/* File input always in DOM so the ref is always valid */}
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
            onChange={handleFileChange} className="hidden" />

          {!previewUrl && !isEditing && (
            <div
              {...getRootProps()}
              onClick={() => fileInputRef.current?.click()}
              className={`h-[220px] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                isDragActive
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-gray-300 hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-600"
              }`}
            >
              <UploadIcon />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {isDragActive ? t("document.dropActive") : t("document.dropInstructions")}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t("document.fileHint")}</p>
              </div>
            </div>
          )}

          {isExtracting && (
            <div className="h-[220px] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("document.extracting")}</p>
                <p className="text-xs text-gray-500 mt-1">{t("document.extractingHint")}</p>
              </div>
            </div>
          )}

          {previewUrl && !isExtracting && (
            <div className="flex items-center justify-between rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                  <DocIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    {selectedFile?.name || t("document.fileLoadedDefault")}
                  </p>
                  <p className="text-xs text-brand-500">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : t("document.existingFile")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Fichier fraîchement sélectionné → blob local (affichage direct OK).
                    // CV existant → passer par l'endpoint inline pour éviter le téléchargement.
                    if (selectedFile) window.open(previewUrl!, "_blank");
                    else if (cvId) openCvInNewTab(cvId).then((ok) => {
                      if (!ok) addToast("error", t("toasts.errorTitle"), t("toasts.openCvError"));
                    });
                    else if (previewUrl) window.open(previewUrl, "_blank");
                  }}
                >
                  {t("document.viewCv")}
                </Button>
                {selectedFile && (
                  <Button variant="outline" size="sm" onClick={() => extractCVData(selectedFile)}
                    startIcon={<RefreshIcon />}>
                    {t("document.reExtract")}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {t("document.change")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Identité ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>2</span>
            {t("steps.identity")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("fields.firstName")}</Label>
              <input className={inputClass} placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.lastName")}</Label>
              <input className={inputClass} placeholder="Dupont" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.email")}</Label>
              <input className={inputClass} type="email" placeholder="jean@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.phone")}</Label>
              <input className={inputClass} placeholder="+33 6 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.linkedin")}</Label>
              <input className={inputClass} placeholder="https://www.linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.portfolio")}</Label>
              <input className={inputClass} placeholder="https://monportfolio.com" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.profileTitle")} <span className="text-gray-400 font-normal">{t("fields.profileTitleHint")}</span></Label>
              <input className={inputClass} placeholder={t("fields.profileTitlePlaceholder")} value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.experienceYears")}</Label>
              <input className={inputClass} type="number" min={0} placeholder="5" value={totalExperience} onChange={(e) => setTotalExperience(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.specialty")}</Label>
              <input className={inputClass} placeholder={t("fields.specialtyPlaceholder")} value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.location")}</Label>
              <input className={inputClass} placeholder={t("fields.locationPlaceholder")} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.industry")}</Label>
              <input className={inputClass} placeholder="IT / Tech" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div>
              <Label>{t("fields.status")}</Label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_VALUES.map((v) => (
                  <option key={v} value={v}>{tStatus(v)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t("fields.source")}</Label>
              <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">{t("fields.selectSource")}</option>
                {cvSources.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>{t("fields.summary")}</Label>
              <RichTextEditor value={summary} onChange={setSummary} placeholder={t("fields.summaryPlaceholder")} />
            </div>
          </div>
        </div>

        {/* ── 3. Expériences ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className={stepBadge}>3</span>
              {t("steps.experiences")}
              <span className="ml-1 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                {experiences.filter(e => e.company || e.title).length}
              </span>
            </h3>
            <Button type="button" size="sm" variant="outline" onClick={addExp} startIcon={<PlusIcon />}>
              {t("experiences.addButton")}
            </Button>
          </div>

          <div className="space-y-4">
            {experiences.map((exp, i) => (
              <div key={i} className="relative rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="absolute top-3 right-3">
                  <button type="button" onClick={() => removeExp(i)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <XIcon />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                  <div>
                    <Label>{t("experiences.jobTitle")}</Label>
                    <input className={inputClass} placeholder={t("experiences.jobTitlePlaceholder")} value={exp.title}
                      onChange={(e) => updateExp(i, "title", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("experiences.company")}</Label>
                    <input className={inputClass} placeholder="Google" value={exp.company}
                      onChange={(e) => updateExp(i, "company", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("experiences.startDate")}</Label>
                    <MonthYearPicker
                      value={exp.start_date || ""}
                      onChange={(v) => updateExp(i, "start_date", v)}
                    />
                  </div>
                  <div>
                    <Label>{t("experiences.endDate")} <span className="text-gray-400 font-normal">{t("experiences.endDateHint")}</span></Label>
                    <MonthYearPicker
                      value={exp.end_date || ""}
                      onChange={(v) => updateExp(i, "end_date", v)}
                      placeholder={t("experiences.presentPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label>{t("experiences.location")}</Label>
                    <input className={inputClass} placeholder={t("experiences.locationPlaceholder")} value={exp.location || ""}
                      onChange={(e) => updateExp(i, "location", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t("experiences.description")}</Label>
                    <RichTextEditor
                      value={exp.description || ""}
                      onChange={(v) => updateExp(i, "description", v)}
                      placeholder={t("experiences.descriptionPlaceholder")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Formations ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className={stepBadge}>4</span>
              {t("steps.formations")}
              <span className="ml-1 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                {formations.filter(f => f.institution || f.degree).length}
              </span>
            </h3>
            <Button type="button" size="sm" variant="outline" onClick={addForm} startIcon={<PlusIcon />}>
              {t("formations.addButton")}
            </Button>
          </div>

          <div className="space-y-4">
            {formations.map((f, i) => (
              <div key={i} className="relative rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="absolute top-3 right-3">
                  <button type="button" onClick={() => removeForm(i)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <XIcon />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                  <div>
                    <Label>{t("formations.degree")}</Label>
                    <input className={inputClass} placeholder={t("formations.degreePlaceholder")} value={f.degree}
                      onChange={(e) => updateForm(i, "degree", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("formations.institution")}</Label>
                    <input className={inputClass} placeholder={t("formations.institutionPlaceholder")} value={f.institution}
                      onChange={(e) => updateForm(i, "institution", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("formations.field")}</Label>
                    <input className={inputClass} placeholder={t("formations.fieldPlaceholder")} value={f.field || ""}
                      onChange={(e) => updateForm(i, "field", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{t("formations.start")}</Label>
                      <YearPicker
                        value={f.start_date || ""}
                        onChange={(v) => updateForm(i, "start_date", v)}
                      />
                    </div>
                    <div>
                      <Label>{t("formations.end")}</Label>
                      <YearPicker
                        value={f.end_date || ""}
                        onChange={(v) => updateForm(i, "end_date", v)}
                        placeholder={t("formations.endInProgress")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. Compétences ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>5</span>
            {t("steps.skills")}
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputClass} flex-1`}
              placeholder={t("skills.placeholder")}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <Button type="button" variant="outline" onClick={addSkill}>{t("skills.addButton")}</Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((s) => (
                <span key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                    <XSmallIcon />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Compétences transversales (soft skills) */}
          <Label>{t("softSkills.label")}</Label>
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputClass} flex-1`}
              placeholder={t("softSkills.placeholder")}
              value={softSkillInput}
              onChange={(e) => setSoftSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSoftSkill(); } }}
            />
            <Button type="button" variant="outline" onClick={addSoftSkill}>{t("skills.addButton")}</Button>
          </div>
          {softSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {softSkills.map((s) => (
                <span key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {s}
                  <button type="button" onClick={() => removeSoftSkill(s)} className="hover:text-red-500 transition-colors">
                    <XSmallIcon />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Certifications */}
          <Label>{t("certifications.label")}</Label>
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputClass} flex-1`}
              placeholder={t("certifications.placeholder")}
              value={certificationInput}
              onChange={(e) => setCertificationInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCertification(); } }}
            />
            <Button type="button" variant="outline" onClick={addCertification}>{t("skills.addButton")}</Button>
          </div>
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {certifications.map((s) => (
                <span key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {s}
                  <button type="button" onClick={() => removeCertification(s)} className="hover:text-red-500 transition-colors">
                    <XSmallIcon />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── 6. Langues ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>6</span>
            {t("steps.languages")}
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputClass} flex-1`}
              placeholder={t("languages.namePlaceholder")}
              value={langName}
              onChange={(e) => setLangName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
            />
            <select
              className={`h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white dark:border-gray-700`}
              value={langLevel}
              onChange={(e) => setLangLevel(e.target.value)}
            >
              {LANGUAGE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <Button type="button" variant="outline" onClick={addLanguage}>{t("languages.addButton")}</Button>
          </div>
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {languages.map((l, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {l.name}
                  <span className="text-gray-400 dark:text-gray-500">({l.level})</span>
                  <button type="button" onClick={() => removeLanguage(i)} className="hover:text-red-500 transition-colors">
                    <XSmallIcon />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── 7. Préférences ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>7</span>
            {t("steps.preferences")}
          </h3>
          <div className="space-y-4">
            {/* Mobilité */}
            <div>
              <Label>{t("preferences.mobility")}</Label>
              <div className="flex gap-2 mb-2">
                <input
                  className={`${inputClass} flex-1`}
                  placeholder={t("preferences.mobilityPlaceholder")}
                  value={mobilityInput}
                  onChange={(e) => setMobilityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMobility(); } }}
                />
                <Button type="button" variant="outline" onClick={addMobility}>{t("preferences.addButton")}</Button>
              </div>
              {mobility.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mobility.map((m) => (
                    <span key={m}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      📍 {m}
                      <button type="button" onClick={() => removeMobility(m)} className="hover:text-red-500 transition-colors">
                        <XSmallIcon />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Types de contrat */}
            <div>
              <Label>{t("preferences.contractTypes")}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CONTRACT_TYPES.map((type) => {
                  const active = contractTypes.includes(type);
                  return (
                    <button key={type} type="button" onClick={() => toggleContract(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                        active
                          ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
                      }`}>
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Télétravail */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setRemotePreferred(!remotePreferred)}
                className={`relative w-10 h-5 rounded-full transition-colors ${remotePreferred ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${remotePreferred ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{t("preferences.remoteOnly")}</span>
            </label>
          </div>
        </div>

        {/* ── 8. Note interne ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>8</span>
            <Lock size={14} strokeWidth={1.8} className="icon-glow" />
            {t("steps.internalNote")} <span className="text-gray-400 font-normal">{t("internalNote.hint")}</span>
          </h3>
          <textarea
            className={`${inputClass} h-auto py-2 resize-none`}
            rows={3}
            placeholder={t("internalNote.placeholder")}
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
        </div>

        {/* ── Footer buttons ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/cvs")} disabled={isSaving}>
            {t("footer.cancel")}
          </Button>
          <Button type="submit" disabled={isSaving || isExtracting || (!isEditing && !selectedFile)}>
            {isSaving ? t("footer.saving") : isEditing ? t("footer.editSubmit") : t("footer.createSubmit")}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return <ArrowLeft size={18} strokeWidth={1.8} className="icon-glow" />;
}

function UploadIcon() {
  return <Upload size={40} strokeWidth={1.8} className="text-gray-400 icon-glow" />;
}

function DocIcon() {
  return <FileText size={20} strokeWidth={1.8} className="text-brand-600 dark:text-brand-400 icon-glow" />;
}

function PlusIcon() {
  return <Plus size={14} strokeWidth={1.8} className="icon-glow" />;
}

function XIcon() {
  return <X size={12} strokeWidth={1.8} className="icon-glow" />;
}

function XSmallIcon() {
  return <X size={10} strokeWidth={1.8} className="icon-glow" />;
}

function RefreshIcon() {
  return <RefreshCw size={14} strokeWidth={1.8} className="icon-glow" />;
}

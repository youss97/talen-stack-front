"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { CvExperience, CvFormation } from "@/types/cv";

const LANGUAGE_LEVELS = ["Natif", "Courant", "Intermédiaire", "Notions"] as const;
const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance", "Intérim"] as const;
const STATUS_OPTIONS = [
  { value: "new", label: "Nouveau" },
  { value: "reviewed", label: "Examiné" },
  { value: "shortlisted", label: "Présélectionné" },
  { value: "interviewed", label: "Interviewé" },
  { value: "hired", label: "Embauché" },
  { value: "rejected", label: "Rejeté" },
  { value: "archived", label: "Archivé" },
] as const;

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
  const [position, setPosition] = useState("");
  const [totalExperience, setTotalExperience] = useState<string>("");
  const [industry, setIndustry] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("new");
  const [remotePreferred, setRemotePreferred] = useState(false);

  // Tags-based fields
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
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
        setPosition(cv.last_position || "");
        setTotalExperience(cv.total_experience != null ? String(cv.total_experience) : "");
        setIndustry(cv.industry_experience || "");
        setSummary((cv.full_information as any)?.summary || "");
        setStatus(cv.status || "new");
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
      .catch(() => addToast("error", "Erreur", "Erreur lors du chargement du CV"));
  }, [cvId, getCVById, addToast]);

  // ── File upload + extraction ──────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    await extractCVData(file);
  };

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
      if (data.current_position && data.current_position !== "Non spécifié") setPosition(data.current_position);
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

      addToast("success", "Extraction réussie", "Les données ont été extraites du CV");
    } catch {
      addToast("error", "Erreur d'extraction", "Impossible d'extraire les données. Remplissez manuellement.");
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
      addToast("error", "Erreur", "Veuillez uploader un fichier CV");
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
          last_position: position,
          total_experience: totalExperience ? Number(totalExperience) : undefined,
          industry_experience: industry,
          additional_skills: skills,
          languages: langStrings,
          geographic_mobility: mobility,
          contract_type_preferences: contractTypes,
          remote_preferred: remotePreferred,
          status,
          experiences: cleanExperiences,
          formations: cleanFormations,
        };
        await updateCV({ id: cvId, data: payload }).unwrap();
        addToast("success", "Succès", "CV modifié avec succès");
      } else {
        const formData = new FormData();
        if (selectedFile) formData.append("file", selectedFile);

        formData.append("candidate_first_name", firstName);
        formData.append("candidate_last_name", lastName);
        formData.append("candidate_email", email);
        formData.append("candidate_phone", phone);
        formData.append("last_position", position);
        if (totalExperience) formData.append("total_experience", totalExperience);
        formData.append("industry_experience", industry);
        formData.append("remote_preferred", String(remotePreferred));
        formData.append("status", status);

        skills.forEach((s) => formData.append("additional_skills", s));
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
        addToast("success", "Succès", "CV créé avec succès");
      }

      setTimeout(() => router.push("/cvs"), 1200);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string }; message?: string })?.data?.message ||
        (err as { message?: string })?.message ||
        (isEditing ? "Erreur lors de la modification" : "Erreur lors de la création");
      addToast("error", "Erreur", msg);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Back */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/cvs")} startIcon={<ArrowLeftIcon />}>
          Retour à la CVthèque
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. Document ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>1</span>
            Document CV
          </h3>

          {!previewUrl && !isEditing && (
            <>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                onChange={handleFileChange} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()}
                className="h-[220px] w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-600 cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors">
                <UploadIcon />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Cliquez pour uploader un CV</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOCX, DOC, Images, TXT, RTF (max 20MB)</p>
                </div>
              </div>
            </>
          )}

          {isExtracting && (
            <div className="h-[220px] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Extraction IA en cours...</p>
                <p className="text-xs text-gray-500 mt-1">Les données sont automatiquement extraites de votre CV</p>
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
                    {selectedFile?.name || "CV chargé"}
                  </p>
                  <p className="text-xs text-brand-500">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : "Fichier existant"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, "_blank")}>
                  Voir le CV
                </Button>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Changer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Identité ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>2</span>
            Informations du candidat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <input className={inputClass} placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Nom</Label>
              <input className={inputClass} placeholder="Dupont" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <input className={inputClass} type="email" placeholder="jean@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <input className={inputClass} placeholder="+33 6 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Poste actuel / Titre</Label>
              <input className={inputClass} placeholder="Développeur Full Stack" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div>
              <Label>Années d'expérience</Label>
              <input className={inputClass} type="number" min={0} placeholder="5" value={totalExperience} onChange={(e) => setTotalExperience(e.target.value)} />
            </div>
            <div>
              <Label>Secteur d'activité</Label>
              <input className={inputClass} placeholder="IT / Tech" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div>
              <Label>Statut</Label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Résumé professionnel</Label>
              <textarea className={`${inputClass} h-auto py-2 resize-none`} rows={3}
                placeholder="Résumé du profil..."
                value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── 3. Expériences ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className={stepBadge}>3</span>
              Expériences professionnelles
              <span className="ml-1 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                {experiences.filter(e => e.company || e.title).length}
              </span>
            </h3>
            <Button type="button" size="sm" variant="outline" onClick={addExp} startIcon={<PlusIcon />}>
              Ajouter
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
                    <Label>Intitulé du poste</Label>
                    <input className={inputClass} placeholder="Développeur Backend" value={exp.title}
                      onChange={(e) => updateExp(i, "title", e.target.value)} />
                  </div>
                  <div>
                    <Label>Entreprise</Label>
                    <input className={inputClass} placeholder="Google" value={exp.company}
                      onChange={(e) => updateExp(i, "company", e.target.value)} />
                  </div>
                  <div>
                    <Label>Date de début</Label>
                    <input className={inputClass} placeholder="01/2020" value={exp.start_date || ""}
                      onChange={(e) => updateExp(i, "start_date", e.target.value)} />
                  </div>
                  <div>
                    <Label>Date de fin (vide = Présent)</Label>
                    <input className={inputClass} placeholder="12/2023 ou vide" value={exp.end_date || ""}
                      onChange={(e) => updateExp(i, "end_date", e.target.value)} />
                  </div>
                  <div>
                    <Label>Lieu</Label>
                    <input className={inputClass} placeholder="Paris, France" value={exp.location || ""}
                      onChange={(e) => updateExp(i, "location", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Description des missions</Label>
                    <textarea className={`${inputClass} h-auto py-2 resize-none`} rows={2}
                      placeholder="Développement de microservices, gestion d'équipe..."
                      value={exp.description || ""} onChange={(e) => updateExp(i, "description", e.target.value)} />
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
              Formations
              <span className="ml-1 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                {formations.filter(f => f.institution || f.degree).length}
              </span>
            </h3>
            <Button type="button" size="sm" variant="outline" onClick={addForm} startIcon={<PlusIcon />}>
              Ajouter
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
                    <Label>Diplôme</Label>
                    <input className={inputClass} placeholder="Master, Licence, BTS..." value={f.degree}
                      onChange={(e) => updateForm(i, "degree", e.target.value)} />
                  </div>
                  <div>
                    <Label>Établissement</Label>
                    <input className={inputClass} placeholder="Université Paris-Saclay" value={f.institution}
                      onChange={(e) => updateForm(i, "institution", e.target.value)} />
                  </div>
                  <div>
                    <Label>Domaine d'études</Label>
                    <input className={inputClass} placeholder="Informatique, Marketing..." value={f.field || ""}
                      onChange={(e) => updateForm(i, "field", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Début</Label>
                      <input className={inputClass} placeholder="2016" value={f.start_date || ""}
                        onChange={(e) => updateForm(i, "start_date", e.target.value)} />
                    </div>
                    <div>
                      <Label>Fin</Label>
                      <input className={inputClass} placeholder="2018" value={f.end_date || ""}
                        onChange={(e) => updateForm(i, "end_date", e.target.value)} />
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
            Compétences
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputClass} flex-1`}
              placeholder="React, Node.js, Python... (séparées par des virgules)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <Button type="button" variant="outline" onClick={addSkill}>Ajouter</Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
        </div>

        {/* ── 6. Langues ── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className={sectionHeadClass}>
            <span className={stepBadge}>6</span>
            Langues
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputClass} flex-1`}
              placeholder="Français, Anglais..."
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
            <Button type="button" variant="outline" onClick={addLanguage}>Ajouter</Button>
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
            Préférences & Mobilité
          </h3>
          <div className="space-y-4">
            {/* Mobilité */}
            <div>
              <Label>Mobilité géographique</Label>
              <div className="flex gap-2 mb-2">
                <input
                  className={`${inputClass} flex-1`}
                  placeholder="Paris, Lyon, Remote..."
                  value={mobilityInput}
                  onChange={(e) => setMobilityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMobility(); } }}
                />
                <Button type="button" variant="outline" onClick={addMobility}>Ajouter</Button>
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
              <Label>Types de contrat</Label>
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
              <span className="text-sm text-gray-700 dark:text-gray-300">Ouvert au télétravail</span>
            </label>
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/cvs")} disabled={isSaving}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving || isExtracting || (!isEditing && !selectedFile)}>
            {isSaving ? "Enregistrement..." : isEditing ? "Modifier le CV" : "Créer le CV"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M15.8333 10H4.16667M4.16667 10L10 15.8333M4.16667 10L10 4.16667"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="text-gray-400">
      <path d="M24 32V16M24 16L16 24M24 16L32 24" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 36V38C8 40.2091 9.79086 42 12 42H36C38.2091 42 40 40.2091 40 38V36"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-600 dark:text-brand-400">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

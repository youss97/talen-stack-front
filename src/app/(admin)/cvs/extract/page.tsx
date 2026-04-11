"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
import {
  createCVSchema,
  updateCVSchema,
  type CreateCVFormData,
} from "@/validations/cvValidation";
import type { CV } from "@/types/cv";

export default function CVExtractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("id");
  const isEditing = !!cvId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<CV> | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [skillsInput, setSkillsInput] = useState("");

  const [getCVById, { isLoading: isLoadingCV }] = useLazyGetCVByIdQuery();
  const [createCV, { isLoading: isCreating }] = useCreateCVMutation();
  const [updateCV, { isLoading: isUpdating }] = useUpdateCVMutation();
  const [extractCV] = useExtractCVMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCVFormData>({
    resolver: yupResolver(isEditing ? updateCVSchema : createCVSchema) as unknown as Resolver<CreateCVFormData>,
    defaultValues: {
      candidate_email: "",
      candidate_phone: "",
      candidate_first_name: "",
      candidate_last_name: "",
      total_experience: undefined,
      last_education: "",
      last_position: "",
      industry_experience: "",
      remote_preferred: false,
      status: "new",
      contract_type_preferences: "CDI",
      geographic_mobility: "",
    },
  });

  const addToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message?: string
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  // Load existing CV if editing
  useEffect(() => {
    if (cvId) {
      getCVById(cvId)
        .unwrap()
        .then((cv) => {
          const validStatus = cv.status && ["new", "reviewed", "shortlisted", "interviewed", "hired", "rejected", "archived"].includes(cv.status) 
            ? cv.status 
            : "new";
          
          reset({
            candidate_email: cv.candidate_email || "",
            candidate_phone: cv.candidate_phone || "",
            candidate_first_name: cv.candidate_first_name || "",
            candidate_last_name: cv.candidate_last_name || "",
            total_experience: cv.total_experience,
            last_education: cv.last_education || "",
            last_position: cv.last_position || "",
            industry_experience: cv.industry_experience || "",
            remote_preferred: cv.remote_preferred || false,
            status: validStatus as "new" | "reviewed" | "shortlisted" | "interviewed" | "hired" | "rejected" | "archived",
            contract_type_preferences: Array.isArray(cv.contract_type_preferences) 
              ? cv.contract_type_preferences[0] || "CDI" 
              : cv.contract_type_preferences || "CDI",
            geographic_mobility: cv.geographic_mobility?.join(", ") || "",
          });
          setSkillsInput(cv.additional_skills?.join(", ") || "");
          
          if (cv.file_path) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            setPreviewUrl(`${apiUrl}/${cv.file_path}`);
          }
        })
        .catch((error) => {
          addToast("error", "Erreur", getErrorMessage(error, "Erreur lors du chargement du CV"));
        });
    }
  }, [cvId, getCVById, reset, addToast]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("file", file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Extract data from CV
      await extractCVData(file);
    }
  };

  const extractCVData = async (file: File) => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await extractCV(formData).unwrap();
      
      // L'API retourne { extracted_data: {...} }
      const data = response.extracted_data || response;
      setExtractedData(data);

      // Pre-fill form with extracted data
      // Mapper name -> first_name et last_name
      if (data.name) {
        const nameParts = data.name.split(" ");
        if (nameParts.length > 0) {
          setValue("candidate_first_name", nameParts[0]);
          if (nameParts.length > 1) {
            setValue("candidate_last_name", nameParts.slice(1).join(" "));
          }
        }
      }
      
      if (data.email) setValue("candidate_email", data.email);
      if (data.phone) setValue("candidate_phone", data.phone);
      if (data.experience_years) setValue("total_experience", data.experience_years);
      if (data.education) setValue("last_education", data.education);
      if (data.current_position && data.current_position !== "Non spécifié") {
        setValue("last_position", data.current_position);
      }
      if (data.industry && data.industry !== "Non spécifié") {
        setValue("industry_experience", data.industry);
      }
      
      if (data.skills && data.skills.length > 0) {
        setSkillsInput(data.skills.join(", "));
      }

      if (data.locations && data.locations.length > 0) {
        const validLocations = data.locations.filter((loc: string) => loc !== "Non spécifié");
        if (validLocations.length > 0) {
          setValue("geographic_mobility", validLocations.join(", "));
        }
      }

      addToast("success", "Extraction réussie", "Les données ont été extraites du CV");
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de l'extraction des données"));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFormSubmit = async (data: CreateCVFormData) => {
    console.log('🚀 handleFormSubmit appelé', { data, selectedFile, isEditing });
    
    try {
      // Validation manuelle du fichier en mode création
      if (!isEditing && !selectedFile) {
        console.log('❌ Pas de fichier sélectionné');
        addToast("error", "Erreur", "Veuillez uploader un fichier CV");
        return;
      }

      console.log('✅ Validation passée, création du FormData...');
      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (data.candidate_email) formData.append("candidate_email", data.candidate_email);
      if (data.candidate_phone) formData.append("candidate_phone", data.candidate_phone);
      if (data.candidate_first_name) formData.append("candidate_first_name", data.candidate_first_name);
      if (data.candidate_last_name) formData.append("candidate_last_name", data.candidate_last_name);
      if (data.total_experience !== undefined) formData.append("total_experience", String(data.total_experience));
      if (data.last_education) formData.append("last_education", data.last_education);
      if (data.last_position) formData.append("last_position", data.last_position);
      if (data.industry_experience) formData.append("industry_experience", data.industry_experience);
      if (data.remote_preferred !== undefined) formData.append("remote_preferred", String(data.remote_preferred));
      if (data.status) formData.append("status", data.status);

      if (skillsInput) {
        const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
        skills.forEach(skill => formData.append("additional_skills", skill));
      }

      if (data.geographic_mobility) {
        const mobility = data.geographic_mobility.split(",").map(s => s.trim()).filter(Boolean);
        mobility.forEach(m => formData.append("geographic_mobility", m));
      }

      if (data.contract_type_preferences) {
        formData.append("contract_type_preferences", data.contract_type_preferences);
      }

      if (isEditing && cvId) {
        // For update, convert FormData to object
        const updateData: Record<string, unknown> = {};
        const arrays: Record<string, string[]> = {
          additional_skills: [],
          geographic_mobility: [],
          contract_type_preferences: [],
        };

        formData.forEach((value, key) => {
          if (key !== "file") {
            if (key in arrays) {
              arrays[key].push(value as string);
            } else {
              if (key === "total_experience") {
                updateData[key] = value ? Number(value) : undefined;
              } else if (key === "remote_preferred") {
                updateData[key] = value === "true";
              } else {
                updateData[key] = value;
              }
            }
          }
        });

        Object.entries(arrays).forEach(([key, values]) => {
          if (values.length > 0) {
            updateData[key] = values;
          }
        });

        await updateCV({ id: cvId, data: updateData }).unwrap();
        addToast("success", "Succès", "CV modifié avec succès");
      } else {
        console.log('📤 Envoi de la requête createCV...', formData);
        await createCV(formData).unwrap();
        console.log('✅ CV créé avec succès');
        addToast("success", "Succès", "CV créé avec succès");
      }

      setTimeout(() => {
        router.push("/cvs");
      }, 1500);
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      const defaultMsg = isEditing
        ? "Erreur lors de la modification du CV"
        : "Erreur lors de la création du CV";
      addToast("error", "Erreur", getErrorMessage(error, defaultMsg));
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/cvs")}
          startIcon={<ArrowLeftIcon />}
        >
          Retour à la CVthèque
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Section Upload/Info CV */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Document CV
          </h2>

          {!previewUrl && !isEditing && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-[300px] w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 dark:border-gray-700 cursor-pointer flex flex-col items-center justify-center transition-colors"
              >
                <UploadIcon />
                <p className="mt-4 text-sm font-medium text-gray-800 dark:text-white">
                  Cliquez pour uploader un CV
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PDF, DOCX, DOC, Images, TXT, RTF (max 20MB)
                </p>
              </div>
            </div>
          )}

          {isExtracting && (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Extraction des données en cours...
                </p>
              </div>
            </div>
          )}

          {previewUrl && !isExtracting && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      CV uploadé avec succès
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cliquez sur le bouton pour visualiser le document
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    Voir le CV
                  </Button>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Changer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Section - En dessous */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {isEditing ? "Modifier les informations" : "Informations du candidat"}
          </h2>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input
                    placeholder="Jean"
                    {...register("candidate_first_name")}
                    error={!!errors.candidate_first_name}
                    hint={errors.candidate_first_name?.message}
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    placeholder="Dupont"
                    {...register("candidate_last_name")}
                    error={!!errors.candidate_last_name}
                    hint={errors.candidate_last_name?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jean@example.com"
                    {...register("candidate_email")}
                    error={!!errors.candidate_email}
                    hint={errors.candidate_email?.message}
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    placeholder="+33 6 12 34 56 78"
                    {...register("candidate_phone")}
                    error={!!errors.candidate_phone}
                    hint={errors.candidate_phone?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Poste actuel</Label>
                  <Input
                    placeholder="Développeur Full Stack"
                    {...register("last_position")}
                    error={!!errors.last_position}
                    hint={errors.last_position?.message}
                  />
                </div>
                <div>
                  <Label>Années d'expérience</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    {...register("total_experience")}
                    error={!!errors.total_experience}
                    hint={errors.total_experience?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Formation</Label>
                  <Input
                    placeholder="Master Informatique"
                    {...register("last_education")}
                    error={!!errors.last_education}
                    hint={errors.last_education?.message}
                  />
                </div>
                <div>
                  <Label>Secteur d'activité</Label>
                  <Input
                    placeholder="IT / Tech"
                    {...register("industry_experience")}
                    error={!!errors.industry_experience}
                    hint={errors.industry_experience?.message}
                  />
                </div>
              </div>

              <div>
                <Label>Compétences (séparées par des virgules)</Label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, Node.js, TypeScript"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <Label>
                  Mobilité géographique (séparées par des virgules) 
                </Label>
                <input
                  type="text"
                  {...register("geographic_mobility")}
                  placeholder="Paris, Lyon, Remote"
                  className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                    errors.geographic_mobility
                      ? "border-error-500 text-error-800 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                />
                {errors.geographic_mobility && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.geographic_mobility.message}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Type de contrat préféré 
                </Label>
                <select
                  {...register("contract_type_preferences")}
                  className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                    errors.contract_type_preferences
                      ? "border-error-500 text-error-800 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                >
                  <option value="">Sélectionner...</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
                {errors.contract_type_preferences && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.contract_type_preferences.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remote_preferred"
                  {...register("remote_preferred")}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="remote_preferred">Préférence pour le télétravail</Label>
              </div>

              <div>
                <Label>
                  Statut 
                </Label>
                <select
                  {...register("status")}
                  className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                    errors.status
                      ? "border-error-500 text-error-800 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                >
                  <option value="">Sélectionner...</option>
                  <option value="new">Nouveau</option>
                  <option value="reviewed">Examiné</option>
                  <option value="shortlisted">Présélectionné</option>
                  <option value="interviewed">Interviewé</option>
                  <option value="hired">Embauché</option>
                  <option value="rejected">Rejeté</option>
                  <option value="archived">Archivé</option>
                </select>
                {errors.status && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/cvs")}
                disabled={isCreating || isUpdating}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isCreating || isUpdating || isExtracting || (!isEditing && !selectedFile)}
              >
                {isCreating || isUpdating
                  ? "Enregistrement..."
                  : isEditing
                  ? "Modifier"
                  : "Créer"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.8333 10H4.16667M4.16667 10L10 15.8333M4.16667 10L10 4.16667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-400"
    >
      <path
        d="M24 32V16M24 16L16 24M24 16L32 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 36V38C8 40.2091 9.79086 42 12 42H36C38.2091 42 40 40.2091 40 38V36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

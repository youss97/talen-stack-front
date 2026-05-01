"use client";
import { useEffect, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import CloudinaryImageUpload from "@/components/form/input/CloudinaryImageUpload";
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyFormData,
} from "@/validations/companyValidation";
import type { Company } from "@/types/company";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { getImageUrl } from "@/utils/imageHelper";
import { useGetFeaturesQuery, useGetCompanyFeaturesQuery } from "@/lib/services/roleApi";
import { useGetSubscriptionPlansQuery, useGetCompanyPlanQuery } from "@/lib/services/subscriptionApi";
import type { Feature } from "@/types/role";
import type { SubscriptionPlan } from "@/types/subscription";

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateCompanyFormData & { featureIds?: string[]; planId?: string }) => void;
  company?: Company | null;
  isLoading?: boolean;
  readOnly?: boolean;
}

const FEATURE_ICONS: Record<string, string> = {
  Recrutement: "📋",
  Candidatures: "👥",
  Clients: "🏢",
  Managers: "👤",
  Utilisateurs: "🔑",
  Intégrations: "🔗",
  Agenda: "📅",
  Entretiens: "🗣️",
  "Vivier de talents": "💎",
  "Offres Publiques": "📢",
  Emails: "✉️",
  Logs: "📊",
  Rôles: "🛡️",
  Entreprises: "🏭",
};

export default function CompanyFormModal({
  isOpen,
  onClose,
  onSubmit,
  company,
  isLoading = false,
  readOnly = false,
}: CompanyFormModalProps) {
  const isEditing = !!company && !readOnly;
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo || null);
  const [cloudinaryLogoUrl, setCloudinaryLogoUrl] = useState<string>("");
  const [adminPhotoFile, setAdminPhotoFile] = useState<File | null>(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState<string | null>(null);
  const [cloudinaryAdminPhotoUrl, setCloudinaryAdminPhotoUrl] = useState<string>("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const { data: allFeatures = [] } = useGetFeaturesQuery(undefined, { skip: !isOpen });
  const { data: allPlans = [] } = useGetSubscriptionPlansQuery(undefined, { skip: !isOpen });

  const { data: companyFeatures = [] } = useGetCompanyFeaturesQuery(company?.id ?? "", {
    skip: !isOpen || !company?.id,
  });

  const { data: companyCurrentPlan } = useGetCompanyPlanQuery(company?.id ?? "", {
    skip: !isOpen || !company?.id,
  });

  // Stabiliser la dépendance pour éviter la boucle infinie (RTK Query crée un nouveau tableau à chaque render)
  const companyFeatureIdsKey = companyFeatures.map((f: Feature) => f.id).sort().join(",");
  const currentPlanId = companyCurrentPlan?.id ?? "";

  useEffect(() => {
    setSelectedPlanId(currentPlanId);
    if (companyFeatureIdsKey) {
      setSelectedFeatureIds(new Set(companyFeatureIdsKey.split(",").filter(Boolean)));
    } else {
      setSelectedFeatureIds(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFeatureIdsKey, currentPlanId, company?.id]);

  // Quand un plan est sélectionné → auto-remplir les features
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (!planId) return;
    const plan = allPlans.find((p: SubscriptionPlan) => p.id === planId);
    if (plan) {
      const ids = plan.planFeatures
        ?.map((pf) => pf.feature_id || pf.feature?.id)
        .filter(Boolean) as string[];
      setSelectedFeatureIds(new Set(ids));
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCompanyFormData>({
    resolver: yupResolver(
      isEditing ? updateCompanySchema : createCompanySchema
    ) as unknown as Resolver<CreateCompanyFormData>,
    defaultValues: {
      name: "", ice: "", address: "", city: "", postal_code: "",
      country: "Maroc", phone: "", email: "", status: "active",
      adminEmail: "", adminPassword: "", adminFirstName: "", adminLastName: "",
      adminPhone: "", adminPosition: "",
    },
  });

  useEffect(() => {
    if (company) {
      const adminUser = company.users && company.users.length > 0 ? company.users[0] : null;
      reset({
        name: company.name, ice: company.ice || "", address: company.address,
        city: company.city, postal_code: company.postal_code, country: company.country,
        phone: company.phone, email: company.email, status: company.status,
        adminEmail: adminUser?.email || "", adminPassword: "",
        adminFirstName: adminUser?.first_name || "", adminLastName: adminUser?.last_name || "",
        adminPhone: adminUser?.phone || "", adminPosition: adminUser?.position || "",
      });
      setLogoPreview(getImageUrl(company.logo_path || company.logo));
      setAdminPhotoPreview(getImageUrl(adminUser?.photo_path || adminUser?.photo));
    } else {
      reset({
        name: "", ice: "", address: "", city: "", postal_code: "",
        country: "Maroc", phone: "", email: "", status: "active",
        adminEmail: "", adminPassword: "", adminFirstName: "", adminLastName: "",
        adminPhone: "", adminPosition: "",
      });
      setLogoPreview(null);
      setAdminPhotoPreview(null);
    }
    setLogoFile(null);
    setAdminPhotoFile(null);
  }, [company, reset]);

  const handleLogoChange = (file: File | null, cloudinaryUrl?: string) => {
    if (cloudinaryUrl) { setCloudinaryLogoUrl(cloudinaryUrl); setLogoPreview(cloudinaryUrl); }
    setLogoFile(file);
    if (file && !cloudinaryUrl) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (!file && !cloudinaryUrl) {
      setLogoFile(null);
      setLogoPreview(company?.logo || null);
    }
  };

  const handleAdminPhotoChange = (file: File | null, cloudinaryUrl?: string) => {
    if (cloudinaryUrl) { setCloudinaryAdminPhotoUrl(cloudinaryUrl); setAdminPhotoPreview(cloudinaryUrl); }
    setAdminPhotoFile(file);
    if (file && !cloudinaryUrl) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (!file && !cloudinaryUrl) {
      setAdminPhotoFile(null);
      setAdminPhotoPreview(null);
    }
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllFeatures = () => {
    setSelectedFeatureIds(
      selectedFeatureIds.size === allFeatures.length
        ? new Set()
        : new Set(allFeatures.map((f) => f.id))
    );
  };

  const handleFormSubmit = (data: CreateCompanyFormData) => {
    if (!onSubmit) return;
    onSubmit({
      ...data,
      logo: cloudinaryLogoUrl || logoFile,
      adminPhoto: cloudinaryAdminPhotoUrl || adminPhotoFile,
      featureIds: Array.from(selectedFeatureIds),
      planId: selectedPlanId || undefined,
    } as unknown as CreateCompanyFormData & { featureIds?: string[]; planId?: string });
  };

  const sectionClass = "mb-6";
  const sectionHeadClass =
    "flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700";
  const stepBadge =
    "inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-xs font-bold";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {readOnly ? "Détails de l'entreprise" : isEditing ? "Modifier l'entreprise" : "Ajouter une entreprise"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {readOnly
            ? "Consultez les informations de l'entreprise"
            : isEditing
            ? "Modifiez les informations de l'entreprise et ses modules"
            : "Créez l'entreprise, son administrateur et définissez ses modules accessibles"}
        </p>
      </div>

      {isLoading && isEditing ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={!readOnly && onSubmit ? handleSubmit(handleFormSubmit) : (e) => e.preventDefault()}
        >
          <div className="max-h-[65vh] overflow-y-auto px-6 sm:px-8 py-5 space-y-6">

            {/* ── Section 1 : Informations entreprise ── */}
            <div className={sectionClass}>
              <h3 className={sectionHeadClass}>
                <span className={stepBadge}>1</span>
                Informations de l&apos;entreprise
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <CloudinaryImageUpload
                    label="Logo de l'entreprise"
                    preview={logoPreview}
                    shape="square"
                    disabled={readOnly}
                    onChange={handleLogoChange}
                    uploadType="generic"
                    entityId={company?.id || "new"}
                    autoUpload={true}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    helperText="Formats acceptés: JPEG, PNG, GIF, WebP (max 5MB)"
                  />
                </div>

                <div>
                  <Label>Raison sociale {!readOnly && <span className="text-error-500">*</span>}</Label>
                  <Input placeholder="Tech Solutions SARL" {...register("name")} error={!!errors.name} disabled={readOnly} />
                  {errors.name && <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>}
                </div>

                <div>
                  <Label>ICE</Label>
                  <Input placeholder="123456789000000" {...register("ice")} error={!!errors.ice} disabled={readOnly} />
                  {errors.ice && <p className="mt-1 text-sm text-error-500">{errors.ice.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <Label>Adresse</Label>
                  <Input placeholder="12 rue de la Paix" {...register("address")} error={!!errors.address} disabled={readOnly} />
                </div>

                <div>
                  <Label>Ville</Label>
                  <Input placeholder="Paris" {...register("city")} error={!!errors.city} disabled={readOnly} />
                </div>

                <div>
                  <Label>Code postal</Label>
                  <Input placeholder="75001" {...register("postal_code")} error={!!errors.postal_code} disabled={readOnly} />
                </div>

                <div>
                  <Label>Pays</Label>
                  <select
                    {...register("country")}
                    disabled={readOnly}
                    className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800 ${
                      errors.country
                        ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                    }`}
                  >
                    <option value="">— Sélectionner un pays —</option>
                    <option value="Maroc">Maroc</option>
                    <option value="Algérie">Algérie</option>
                    <option value="Tunisie">Tunisie</option>
                    <option value="Libye">Libye</option>
                    <option value="Mauritanie">Mauritanie</option>
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Canada">Canada</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
                    <option value="Mali">Mali</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="Espagne">Espagne</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Italie">Italie</option>
                    <option value="Allemagne">Allemagne</option>
                    <option value="Royaume-Uni">Royaume-Uni</option>
                    <option value="Pays-Bas">Pays-Bas</option>
                    <option value="États-Unis">États-Unis</option>
                    <option value="Émirats arabes unis">Émirats arabes unis</option>
                    <option value="Arabie Saoudite">Arabie Saoudite</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {errors.country && <p className="mt-1 text-sm text-error-500">{errors.country.message}</p>}
                </div>

                <div>
                  <Label>Statut {!readOnly && <span className="text-error-500">*</span>}</Label>
                  <select
                    {...register("status")}
                    disabled={readOnly}
                    className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800 ${
                      errors.status
                        ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                    }`}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Section 2 : Contact ── */}
            <div className={sectionClass}>
              <h3 className={sectionHeadClass}>
                <span className={stepBadge}>2</span>
                Informations de contact
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Téléphone {!readOnly && <span className="text-error-500">*</span>}</Label>
                  <Input type="tel" placeholder="+33612345678" {...register("phone")} error={!!errors.phone} disabled={readOnly} />
                  {errors.phone && <p className="mt-1 text-sm text-error-500">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label>Email {!readOnly && <span className="text-error-500">*</span>}</Label>
                  <Input type="email" placeholder="contact@techsolutions.fr" {...register("email")} error={!!errors.email} disabled={readOnly} />
                  {errors.email && <p className="mt-1 text-sm text-error-500">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            {/* ── Section 3 : Administrateur ── */}
            {((company && company.users && company.users.length > 0) || !readOnly) && (
              <div className={sectionClass}>
                <h3 className={sectionHeadClass}>
                  <span className={stepBadge}>3</span>
                  Administrateur de l&apos;entreprise
                  {isEditing && !readOnly && (
                    <span className="ml-1 text-xs font-normal text-gray-400">(informations actuelles)</span>
                  )}
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <CloudinaryImageUpload
                      label="Photo de l'administrateur"
                      preview={adminPhotoPreview}
                      shape="circle"
                      onChange={readOnly ? undefined : handleAdminPhotoChange}
                      disabled={readOnly}
                      uploadType="profile-photo"
                      entityType="admin"
                      entityId={company?.users?.[0]?.id || "new"}
                      autoUpload={true}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                    />
                  </div>

                  <div>
                    <Label>Prénom {!isEditing && !readOnly && <span className="text-error-500">*</span>}</Label>
                    <Input placeholder="John" {...register("adminFirstName")} error={!!errors.adminFirstName} disabled={readOnly || isEditing} />
                    {errors.adminFirstName && !readOnly && <p className="mt-1 text-sm text-error-500">{errors.adminFirstName.message}</p>}
                    {isEditing && !readOnly && <p className="mt-1 text-xs text-gray-400">Non modifiable</p>}
                  </div>

                  <div>
                    <Label>Nom {!isEditing && !readOnly && <span className="text-error-500">*</span>}</Label>
                    <Input placeholder="Doe" {...register("adminLastName")} error={!!errors.adminLastName} disabled={readOnly || isEditing} />
                    {errors.adminLastName && !readOnly && <p className="mt-1 text-sm text-error-500">{errors.adminLastName.message}</p>}
                    {isEditing && !readOnly && <p className="mt-1 text-xs text-gray-400">Non modifiable</p>}
                  </div>

                  <div>
                    <Label>Email {!isEditing && !readOnly && <span className="text-error-500">*</span>}</Label>
                    <Input type="email" placeholder="admin@example.com" {...register("adminEmail")} error={!!errors.adminEmail} disabled={readOnly || isEditing} />
                    {errors.adminEmail && !readOnly && <p className="mt-1 text-sm text-error-500">{errors.adminEmail.message}</p>}
                    {isEditing && !readOnly && <p className="mt-1 text-xs text-gray-400">Non modifiable</p>}
                  </div>

                  {!isEditing && !readOnly && (
                    <div>
                      <Label>Mot de passe <span className="text-error-500">*</span></Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="StrongPassword123"
                          {...register("adminPassword")}
                          error={!!errors.adminPassword}
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                        >
                          {showPassword ? (
                            <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                          ) : (
                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                          )}
                        </span>
                      </div>
                      {errors.adminPassword && <p className="mt-1 text-sm text-error-500">{errors.adminPassword.message}</p>}
                    </div>
                  )}

                  <div>
                    <Label>Téléphone de l&apos;administrateur</Label>
                    <Input type="tel" placeholder="+212612345678" {...register("adminPhone")} error={!!errors.adminPhone} disabled={readOnly} />
                    {errors.adminPhone && <p className="mt-1 text-sm text-error-500">{errors.adminPhone.message}</p>}
                  </div>

                  <div>
                    <Label>Poste / Position</Label>
                    <Input placeholder="Directeur RH" {...register("adminPosition")} error={!!errors.adminPosition} disabled={readOnly} />
                    {errors.adminPosition && <p className="mt-1 text-sm text-error-500">{errors.adminPosition.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Section 4 : Abonnement & Modules ── */}
            {!readOnly && (
              <div className={sectionClass}>
                <h3 className={sectionHeadClass}>
                  <span className={stepBadge}>4</span>
                  Abonnement &amp; Modules
                </h3>

                {/* Sélecteur de plan */}
                <div className="mb-4">
                  <Label>Plan d&apos;abonnement</Label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                  >
                    <option value="">— Aucun abonnement (sélection manuelle) —</option>
                    {allPlans.filter((p: SubscriptionPlan) => p.is_active).map((p: SubscriptionPlan) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {Number(p.price).toFixed(2)} MAD/{p.billing_cycle === "monthly" ? "mois" : p.billing_cycle === "annual" ? "an" : "unique"}
                      </option>
                    ))}
                  </select>
                  {selectedPlanId && (
                    <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">
                      ✓ Les modules ci-dessous ont été pré-sélectionnés depuis ce plan
                    </p>
                  )}
                </div>

                {/* Modules (pré-remplis par le plan ou sélection manuelle) */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Modules accessibles
                    <span className="ml-2 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                      {selectedFeatureIds.size}/{allFeatures.length}
                    </span>
                  </p>
                  {allFeatures.length > 0 && (
                    <button type="button" onClick={toggleAllFeatures} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                      {selectedFeatureIds.size === allFeatures.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </button>
                  )}
                </div>

                {allFeatures.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun module disponible</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allFeatures.map((feature) => {
                      const checked = selectedFeatureIds.has(feature.id);
                      const icon = FEATURE_ICONS[feature.name] || "⚙️";
                      return (
                        <label
                          key={feature.id}
                          className={`flex items-center gap-2 rounded-xl border-2 p-2.5 cursor-pointer transition-all select-none ${
                            checked
                              ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20"
                              : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/30"
                          }`}
                        >
                          <div className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            checked ? "bg-brand-500 border-brand-500" : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {checked && <svg width="10" height="8" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                          </div>
                          <input type="checkbox" checked={checked} onChange={() => toggleFeature(feature.id)} className="sr-only" />
                          <span className="text-sm">{icon}</span>
                          <span className={`text-xs font-medium truncate ${checked ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                            {feature.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mode consultation : abonnement + modules */}
            {readOnly && company && (
              <div className={sectionClass}>
                <h3 className={sectionHeadClass}>
                  <span className={stepBadge}>4</span>
                  Abonnement &amp; Modules
                </h3>
                {companyCurrentPlan && (
                  <div className="mb-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-4 py-2.5 flex items-center gap-2">
                    <span>📦</span>
                    <div>
                      <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">{companyCurrentPlan.name}</p>
                      <p className="text-xs text-brand-500">{Number(companyCurrentPlan.price).toFixed(2)} MAD</p>
                    </div>
                  </div>
                )}
                {companyFeatures.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Tous les modules (aucune restriction)</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {companyFeatures.map((f: Feature) => (
                      <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        <span>{FEATURE_ICONS[f.name] || "⚙️"}</span>
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-gray-800">
            {!readOnly && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {selectedFeatureIds.size > 0
                  ? `${selectedFeatureIds.size} module${selectedFeatureIds.size > 1 ? "s" : ""} sélectionné${selectedFeatureIds.size > 1 ? "s" : ""}`
                  : "Aucun module sélectionné — accès complet"}
              </p>
            )}
            {readOnly ? (
              <div className="ml-auto">
                <Button variant="outline" onClick={onClose}>Fermer</Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Enregistrement..." : isEditing ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

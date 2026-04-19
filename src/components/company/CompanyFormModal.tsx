"use client";
import { useEffect, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ImageUpload from "@/components/form/input/ImageUpload";
import CloudinaryImageUpload from "@/components/form/input/CloudinaryImageUpload";
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyFormData,
} from "@/validations/companyValidation";
import type { Company } from "@/types/company";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { getImageUrl } from "@/utils/imageHelper";

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateCompanyFormData) => void;
  company?: Company | null;
  isLoading?: boolean;
  readOnly?: boolean;
}

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
  const [cloudinaryLogoUrl, setCloudinaryLogoUrl] = useState<string>('');
  const [adminPhotoFile, setAdminPhotoFile] = useState<File | null>(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState<string | null>(null);
  const [cloudinaryAdminPhotoUrl, setCloudinaryAdminPhotoUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCompanyFormData>({
    resolver: yupResolver(isEditing ? updateCompanySchema : createCompanySchema) as unknown as Resolver<CreateCompanyFormData>,
    defaultValues: {
      name: "",
      siret: "",
      address: "",
      city: "",
      postal_code: "",
      country: "France",
      phone: "",
      email: "",
      status: "active",
      adminEmail: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
    },
  });

  useEffect(() => {
    if (company) {
      // Get admin user data if exists
      const adminUser = company.users && company.users.length > 0 ? company.users[0] : null;
      
      reset({
        name: company.name,
        siret: company.siret,
        address: company.address,
        city: company.city,
        postal_code: company.postal_code,
        country: company.country,
        phone: company.phone,
        email: company.email,
        status: company.status,
        adminEmail: adminUser?.email || "",
        adminPassword: "",
        adminFirstName: adminUser?.first_name || "",
        adminLastName: adminUser?.last_name || "",
      });
      setLogoPreview(getImageUrl(company.logo_path || company.logo));
      setAdminPhotoPreview(getImageUrl(adminUser?.photo_path || adminUser?.photo));
    } else {
      reset({
        name: "",
        siret: "",
        address: "",
        city: "",
        postal_code: "",
        country: "France",
        phone: "",
        email: "",
        status: "active",
        adminEmail: "",
        adminPassword: "",
        adminFirstName: "",
        adminLastName: "",
      });
      setLogoPreview(null);
      setAdminPhotoPreview(null);
    }
    setLogoFile(null);
    setAdminPhotoFile(null);
  }, [company, reset]);

  const handleLogoChange = (file: File | null, cloudinaryUrl?: string) => {
    if (cloudinaryUrl) {
      setCloudinaryLogoUrl(cloudinaryUrl);
      setLogoPreview(cloudinaryUrl);
    }
    setLogoFile(file);
    if (file && !cloudinaryUrl) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!file && !cloudinaryUrl) {
      setLogoFile(null);
      setLogoPreview(company?.logo || null);
    }
  };

  const handleAdminPhotoChange = (file: File | null, cloudinaryUrl?: string) => {
    if (cloudinaryUrl) {
      setCloudinaryAdminPhotoUrl(cloudinaryUrl);
      setAdminPhotoPreview(cloudinaryUrl);
    }
    setAdminPhotoFile(file);
    if (file && !cloudinaryUrl) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!file && !cloudinaryUrl) {
      setAdminPhotoFile(null);
      setAdminPhotoPreview(null);
    }
  };

  const handleFormSubmit = (data: CreateCompanyFormData) => {
    if (!onSubmit) return;
    
    // Add files to data
    const dataWithFiles = {
      ...data,
      logo: cloudinaryLogoUrl || logoFile,
      adminPhoto: cloudinaryAdminPhotoUrl || adminPhotoFile,
    };
    
    onSubmit(dataWithFiles as unknown as CreateCompanyFormData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {readOnly
            ? "Détails de l'entreprise"
            : isEditing
            ? "Modifier l'entreprise"
            : "Ajouter une entreprise"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {readOnly
            ? "Consultez les informations de l'entreprise"
            : isEditing
            ? "Modifiez les informations de l'entreprise"
            : "Remplissez les informations pour créer une nouvelle entreprise avec son administrateur"}
        </p>
      </div>

      {isLoading && isEditing ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement des données...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={!readOnly && onSubmit ? handleSubmit(handleFormSubmit) : (e) => e.preventDefault()}>
        <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          {/* Section Informations Entreprise */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Informations de l&apos;entreprise
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Logo avec Cloudinary - En premier */}
              <div className="sm:col-span-2">
                <CloudinaryImageUpload
                  label="Logo de l'entreprise"
                  preview={logoPreview}
                  shape="square"
                  disabled={readOnly}
                  onChange={handleLogoChange}
                  uploadType="generic"
                  entityId={company?.id || 'new'}
                  autoUpload={true}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  helperText="Formats acceptés: JPEG, PNG, GIF, WebP (max 5MB)"
                />
              </div>

              <div>
                <Label>
                  Nom {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder="Tech Solutions SARL"
                  {...register("name")}
                  error={!!errors.name}
                  disabled={readOnly}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label>
                  SIRET {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder="12345678901234"
                  {...register("siret")}
                  error={!!errors.siret}
                  disabled={readOnly}
                />
                {errors.siret && (
                  <p className="mt-1 text-sm text-error-500">{errors.siret.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label>
                  Adresse
                </Label>
                <Input
                  placeholder="12 rue de la Paix"
                  {...register("address")}
                  error={!!errors.address}
                  disabled={readOnly}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-error-500">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Ville
                </Label>
                <Input
                  placeholder="Paris"
                  {...register("city")}
                  error={!!errors.city}
                  disabled={readOnly}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-error-500">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Code postal
                </Label>
                <Input
                  placeholder="75001"
                  {...register("postal_code")}
                  error={!!errors.postal_code}
                  disabled={readOnly}
                />
                {errors.postal_code && (
                  <p className="mt-1 text-sm text-error-500">{errors.postal_code.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Pays
                </Label>
                <Input
                  placeholder="France"
                  {...register("country")}
                  error={!!errors.country}
                  disabled={readOnly}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-error-500">{errors.country.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Téléphone
                </Label>
                <Input
                  placeholder="+33612345678"
                  {...register("phone")}
                  error={!!errors.phone}
                  disabled={readOnly}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-500">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="contact@techsolutions.fr"
                  {...register("email")}
                  error={!!errors.email}
                  disabled={readOnly}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Statut {!readOnly && <span className="text-error-500">*</span>}
                </Label>
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
                {errors.status && (
                  <p className="mt-1 text-sm text-error-500">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Administrateur - Show when there's admin data or in create/edit mode */}
          {((company && company.users && company.users.length > 0) || !readOnly) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Administrateur de l&apos;entreprise
                {isEditing && !readOnly && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (Informations actuelles)
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Photo admin avec Cloudinary - En premier */}
                <div className="sm:col-span-2">
                  <CloudinaryImageUpload
                    label="Photo de l'administrateur"
                    preview={adminPhotoPreview}
                    shape="circle"
                    onChange={readOnly ? undefined : handleAdminPhotoChange}
                    disabled={readOnly}
                    uploadType="profile-photo"
                    entityType="admin"
                    entityId={company?.users?.[0]?.id || 'new'}
                    autoUpload={true}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    helperText="Formats acceptés: JPEG, PNG, GIF, WebP (max 5MB)"
                  />
                  {isEditing && !readOnly && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Laissez vide pour conserver la photo actuelle
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Prénom {!isEditing && !readOnly && <span className="text-error-500">*</span>}
                  </Label>
                  <Input
                    placeholder="John"
                    {...register("adminFirstName")}
                    error={!!errors.adminFirstName}
                    disabled={readOnly || isEditing}
                  />
                  {errors.adminFirstName && !readOnly && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.adminFirstName.message}
                    </p>
                  )}
                  {isEditing && !readOnly && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Non modifiable
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Nom {!isEditing && !readOnly && <span className="text-error-500">*</span>}
                  </Label>
                  <Input
                    placeholder="Doe"
                    {...register("adminLastName")}
                    error={!!errors.adminLastName}
                    disabled={readOnly || isEditing}
                  />
                  {errors.adminLastName && !readOnly && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.adminLastName.message}
                    </p>
                  )}
                  {isEditing && !readOnly && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Non modifiable
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Email {!isEditing && !readOnly && <span className="text-error-500">*</span>}
                  </Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    {...register("adminEmail")}
                    error={!!errors.adminEmail}
                    disabled={readOnly || isEditing}
                  />
                  {errors.adminEmail && !readOnly && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.adminEmail.message}
                    </p>
                  )}
                  {isEditing && !readOnly && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Non modifiable
                    </p>
                  )}
                </div>

                {!isEditing && !readOnly && (
                  <div>
                    <Label>
                      Mot de passe <span className="text-error-500">*</span>
                    </Label>
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
                    {errors.adminPassword && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.adminPassword.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
          {readOnly ? (
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Enregistrement..."
                  : isEditing
                  ? "Modifier"
                  : "Ajouter"}
              </Button>
            </>
          )}
        </div>
      </form>
      )}
    </Modal>
  );
}

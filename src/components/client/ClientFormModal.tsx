"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ImageUpload from "@/components/form/input/ImageUpload";
import CloudinaryImageUpload from "@/components/form/input/CloudinaryImageUpload";
import Badge from "@/components/ui/badge/Badge";
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientFormData,
} from "@/validations/clientValidation";
import type { Client } from "@/types/client";
import { COUNTRY_LIST } from "@/types/client";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { getImageUrl } from "@/utils/imageHelper";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateClientFormData) => void;
  client?: Client | null;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  client,
  isLoading = false,
  readOnly = false,
}: ClientFormModalProps) {
  const isEditing = !!client && !readOnly;
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cloudinaryLogoUrl, setCloudinaryLogoUrl] = useState<string>("");
  const [adminPhotoFile, setAdminPhotoFile] = useState<File | null>(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState<string | null>(null);
  const [cloudinaryAdminPhotoUrl, setCloudinaryAdminPhotoUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientFormData>({
    resolver: yupResolver(isEditing ? updateClientSchema : createClientSchema) as any,
    defaultValues: {
      name: "",
      ice: "",
      address: "",
      city: "",
      postal_code: "",
      country: "Maroc",
      phone: "",
      email: "",
      status: "active",
      adminEmail: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
      adminPhone: "",
      adminPosition: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (client) {
        const displayName = client.company_name || client.name;
        const displayIce = client.company_ice || client.ice || client.company_siret || client.siret || "";
        const displayAddress = client.company_address || client.address;
        const displayCity = client.company_city || client.city;
        const displayPostalCode = client.company_postal_code || client.postal_code;
        const displayCountry = client.company_country || client.country;
        const displayPhone = client.company_phone || client.phone || "";
        const displayEmail = client.company_email || client.email || "";

        reset({
          name: displayName,
          ice: displayIce,
          address: displayAddress,
          city: displayCity,
          postal_code: displayPostalCode,
          country: displayCountry,
          phone: displayPhone,
          email: displayEmail,
          status: client.status,
          adminEmail: "",
          adminPassword: "",
          adminFirstName: "",
          adminLastName: "",
          adminPhone: "",
          adminPosition: "",
        });
        setLogoPreview(getImageUrl(client.company_logo_path || client.logo) || null);
        setLogoFile(null);
        setAdminPhotoFile(null);
        setAdminPhotoPreview(null);
        setCloudinaryLogoUrl("");
        setCloudinaryAdminPhotoUrl("");
      } else {
        reset({
          name: "",
          ice: "",
          address: "",
          city: "",
          postal_code: "",
          country: "Maroc",
          phone: "",
          email: "",
          status: "active",
          adminEmail: "",
          adminPassword: "",
          adminFirstName: "",
          adminLastName: "",
          adminPhone: "",
          adminPosition: "",
        });
        setLogoPreview(null);
        setLogoFile(null);
        setAdminPhotoFile(null);
        setAdminPhotoPreview(null);
        setCloudinaryLogoUrl("");
        setCloudinaryAdminPhotoUrl("");
        setShowPassword(false);
      }
    }
  }, [isOpen, client, reset]);

  const handleLogoChange = (file: File | null, cloudinaryUrl?: string) => {
    if (cloudinaryUrl) {
      setCloudinaryLogoUrl(cloudinaryUrl);
      setLogoPreview(cloudinaryUrl);
    }
    setLogoFile(file);
    if (file && !cloudinaryUrl) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (!file && !cloudinaryUrl) {
      setLogoFile(null);
      setLogoPreview(getImageUrl(client?.company_logo_path || client?.logo) || null);
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
      reader.onloadend = () => setAdminPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (!file && !cloudinaryUrl) {
      setAdminPhotoFile(null);
      setAdminPhotoPreview(null);
    }
  };

  const handleFormSubmit = (data: CreateClientFormData) => {
    if (!onSubmit) return;
    onSubmit({
      ...data,
      logo: cloudinaryLogoUrl || logoFile || undefined,
      adminPhoto: cloudinaryAdminPhotoUrl || adminPhotoFile || undefined,
    } as CreateClientFormData);
  };

  const selectClass = (hasError: boolean) =>
    `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800 ${
      hasError
        ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {readOnly ? "Détails du client" : isEditing ? "Modifier le client" : "Ajouter un client"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {readOnly
            ? "Consultez les informations du client"
            : isEditing
            ? "Modifiez les informations du client"
            : "Remplissez les informations pour créer un nouveau client"}
        </p>
      </div>

      <form
        onSubmit={!readOnly && onSubmit ? handleSubmit(handleFormSubmit) : (e) => e.preventDefault()}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar space-y-6">

          {/* ── Section Informations de la société ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Informations de la société
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Logo */}
              <div className="sm:col-span-2">
                <CloudinaryImageUpload
                  label="Logo du client"
                  preview={logoPreview}
                  shape="square"
                  disabled={readOnly}
                  onChange={handleLogoChange}
                  uploadType="generic"
                  entityId={client?.id || "new"}
                  autoUpload={true}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  helperText="Formats acceptés: JPEG, PNG, GIF, WebP (max 5MB)"
                />
              </div>

              {/* Raison sociale */}
              <div className="sm:col-span-2">
                <Label>
                  Raison sociale {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder="Tech Solutions SARL"
                  {...register("name")}
                  error={!!errors.name}
                  disabled={readOnly}
                />
                {errors.name && <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>}
              </div>

              {/* ICE */}
              <div>
                <Label>
                  ICE {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder="123456789012345"
                  maxLength={15}
                  {...register("ice")}
                  error={!!errors.ice}
                  disabled={readOnly}
                />
                {errors.ice && <p className="mt-1 text-sm text-error-500">{errors.ice.message}</p>}
                {!readOnly && (
                  <p className="mt-1 text-xs text-gray-400">Identifiant Commun de l'Entreprise · 15 chiffres</p>
                )}
              </div>

              {/* Pays */}
              <div>
                <Label>
                  Pays {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                {readOnly ? (
                  <Input value={client?.company_country || client?.country || ""} disabled />
                ) : (
                  <select {...register("country")} className={selectClass(!!errors.country)}>
                    {COUNTRY_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
                {errors.country && <p className="mt-1 text-sm text-error-500">{errors.country.message}</p>}
              </div>

              {/* Adresse */}
              <div className="sm:col-span-2">
                <Label>
                  Adresse {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder="12 rue de la Paix"
                  {...register("address")}
                  error={!!errors.address}
                  disabled={readOnly}
                />
                {errors.address && <p className="mt-1 text-sm text-error-500">{errors.address.message}</p>}
              </div>

              {/* Ville */}
              <div>
                <Label>
                  Ville {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder="Casablanca"
                  {...register("city")}
                  error={!!errors.city}
                  disabled={readOnly}
                />
                {errors.city && <p className="mt-1 text-sm text-error-500">{errors.city.message}</p>}
              </div>

              {/* Code postal */}
              <div>
                <Label>Code postal</Label>
                <Input
                  placeholder="20000"
                  {...register("postal_code")}
                  error={!!errors.postal_code}
                  disabled={readOnly}
                />
              </div>

              {/* Statut */}
              <div>
                <Label>
                  Statut {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                {readOnly ? (
                  <div className="mt-2">
                    <Badge color={client?.status === "active" ? "success" : "error"} variant="light">
                      {client?.status === "active" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                ) : (
                  <select {...register("status")} className={selectClass(!!errors.status)}>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                )}
                {errors.status && <p className="mt-1 text-sm text-error-500">{errors.status.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Section Contact ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Contact
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Téléphone */}
              <div>
                <Label>
                  Téléphone {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  type="tel"
                  placeholder="+212612345678"
                  {...register("phone")}
                  error={!!errors.phone}
                  disabled={readOnly}
                />
                {errors.phone && <p className="mt-1 text-sm text-error-500">{errors.phone.message}</p>}
              </div>

              {/* Email */}
              <div>
                <Label>
                  Email {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  type="email"
                  placeholder="contact@techsolutions.ma"
                  {...register("email")}
                  error={!!errors.email}
                  disabled={readOnly}
                />
                {errors.email && <p className="mt-1 text-sm text-error-500">{errors.email.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Admin info (read-only view) ── */}
          {readOnly && client?.managers && client.managers.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Administrateur du client
              </h3>
              {client.managers.map((assignment: any) => {
                const mgr = assignment.manager;
                return (
                  <div key={assignment.id} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <ImageUpload label="Photo" preview={getImageUrl(mgr.photo_path)} shape="circle" disabled />
                    </div>
                    <div>
                      <Label>Prénom</Label>
                      <Input value={mgr.first_name} disabled />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input value={mgr.last_name} disabled />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={mgr.email} disabled />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input value={mgr.phone || "Non renseigné"} disabled />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Statut</Label>
                      <div className="mt-2">
                        <Badge color={mgr.status === "active" ? "success" : "error"} variant="light">
                          {mgr.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── Extra info (read-only) ── */}
          {readOnly && client && (client.industry || client.company_size || client.vat_rate || client.payment_terms) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Informations supplémentaires
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {client.industry && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Secteur</p>
                    <p className="text-sm text-gray-900 dark:text-white">{client.industry}</p>
                  </div>
                )}
                {client.company_size && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Taille</p>
                    <p className="text-sm text-gray-900 dark:text-white">{client.company_size}</p>
                  </div>
                )}
                {client.vat_rate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Taux TVA</p>
                    <p className="text-sm text-gray-900 dark:text-white">{client.vat_rate}%</p>
                  </div>
                )}
                {client.payment_terms && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Conditions de paiement</p>
                    <p className="text-sm text-gray-900 dark:text-white">{client.payment_terms}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Admin creation section ── */}
          {!isEditing && !readOnly && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Administrateur du client
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <ImageUpload
                    label="Photo de l'administrateur"
                    preview={adminPhotoPreview}
                    shape="circle"
                    onChange={handleAdminPhotoChange}
                  />
                </div>

                <div>
                  <Label>Prénom <span className="text-error-500">*</span></Label>
                  <Input placeholder="John" {...register("adminFirstName")} error={!!errors.adminFirstName} />
                  {errors.adminFirstName && <p className="mt-1 text-sm text-error-500">{errors.adminFirstName.message}</p>}
                </div>

                <div>
                  <Label>Nom <span className="text-error-500">*</span></Label>
                  <Input placeholder="Doe" {...register("adminLastName")} error={!!errors.adminLastName} />
                  {errors.adminLastName && <p className="mt-1 text-sm text-error-500">{errors.adminLastName.message}</p>}
                </div>

                <div>
                  <Label>Email <span className="text-error-500">*</span></Label>
                  <Input type="email" placeholder="admin@example.com" {...register("adminEmail")} error={!!errors.adminEmail} />
                  {errors.adminEmail && <p className="mt-1 text-sm text-error-500">{errors.adminEmail.message}</p>}
                </div>

                <div>
                  <Label>Téléphone <span className="text-error-500">*</span></Label>
                  <Input type="tel" placeholder="+212612345678" {...register("adminPhone")} error={!!errors.adminPhone} />
                  {errors.adminPhone && <p className="mt-1 text-sm text-error-500">{errors.adminPhone.message}</p>}
                </div>

                <div>
                  <Label>Mot de passe <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
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

                <div>
                  <Label>Position</Label>
                  <Input placeholder="Directeur Général" {...register("adminPosition")} error={!!errors.adminPosition} />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          {readOnly ? (
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : isEditing ? "Modifier" : "Ajouter"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}

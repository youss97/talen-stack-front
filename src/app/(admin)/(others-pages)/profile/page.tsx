"use client";
import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Modal } from "@/components/ui/modal";
import { useUpdateProfileMutation } from "@/lib/services/userApi";
import { setCredentials } from "@/lib/slices/authSlice";
import { useAppSelector } from "@/lib/hooks";
import { getImageUrl } from "@/utils/imageHelper";
import type { RootState } from "@/lib/store";

const schema = yup.object({
  first_name: yup.string().required("Requis"),
  last_name: yup.string().required("Requis"),
  phone: yup.string().optional(),
  position: yup.string().optional(),
  bio: yup.string().optional(),
  linkedin: yup.string().optional(),
  twitter: yup.string().optional(),
  facebook: yup.string().optional(),
  instagram: yup.string().optional(),
  country: yup.string().optional(),
  city: yup.string().optional(),
  postal_code: yup.string().optional(),
  tax_id: yup.string().optional(),
  current_password: yup.string().optional(),
  new_password: yup.string().optional(),
  photo: yup.mixed().optional(),
});

type FormData = yup.InferType<typeof schema>;

function InfoItem({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
          {value || <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function SocialLink({ href, label, icon }: { href?: string | null; label: string; icon: React.ReactNode }) {
  if (!href) return (
    <div className="flex items-center gap-2 text-gray-300 dark:text-gray-600">
      {icon}<span className="text-sm">{label}</span>
      <span className="text-xs ml-auto text-gray-200 dark:text-gray-700">—</span>
    </div>
  );
  const safeHref = normalizeUrl(href);
  return (
    <a href={safeHref} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group">
      {icon}
      <span className="text-sm truncate">{href.replace(/^https?:\/\//, '')}</span>
      <svg className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-brand-500">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUser = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "social" | "address" | "security">("info");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
  });

  const openModal = () => {
    reset({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
      position: user?.position || "",
      bio: user?.bio || "",
      linkedin: user?.linkedin || "",
      twitter: user?.twitter || "",
      facebook: user?.facebook || "",
      instagram: user?.instagram || "",
      country: user?.country || "",
      city: user?.city || "",
      postal_code: user?.postal_code || "",
      tax_id: user?.tax_id || "",
      current_password: "",
      new_password: "",
    });
    setPhotoPreview(getImageUrl(user?.photo_path) || null);
    setActiveTab("info");
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue("photo", file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const fd = new FormData();
      (Object.keys(data) as (keyof FormData)[]).forEach((key) => {
        const val = data[key];
        if (key === "photo") {
          if (val instanceof File) fd.append("photo", val);
        } else if (key === "current_password" || key === "new_password") {
          // Only send password fields if non-empty — empty string fails @MinLength(8)
          if (val && String(val).length > 0) fd.append(key, String(val));
        } else if (val !== undefined && val !== null) {
          fd.append(key, String(val));
        }
      });
      const result = await updateProfile(fd).unwrap();
      if (result.user) {
        const token = localStorage.getItem("token") || "";
        const refresh_token = localStorage.getItem("refresh_token") || undefined;
        dispatch(setCredentials({
          user: { ...currentUser, ...result.user, features: currentUser?.features, role: currentUser?.role, company: currentUser?.company } as any,
          token,
          refresh_token,
        }));
      }
      setIsOpen(false);
    } catch (err: any) {
      const detail = err?.data?.message || err?.data?.error || err?.message || JSON.stringify(err);
      console.error("Erreur mise à jour profil:", detail, err);
    }
  };

  if (!user) return null;

  const photoUrl = getImageUrl(user.photo_path) || null;
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase() || "U";

  const tabs = [
    { key: "info", label: "Informations" },
    { key: "social", label: "Réseaux sociaux" },
    { key: "address", label: "Adresse" },
    { key: "security", label: "Sécurité" },
  ] as const;

  return (
    <div className="space-y-5 pb-8">

      {/* ── Hero Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Cover banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600" />

        <div className="px-5 pb-5 lg:px-8 lg:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-12">
            {/* Avatar */}
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white dark:border-gray-900 overflow-hidden bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 shadow-md">
                {photoUrl ? (
                  <img src={photoUrl} alt="Photo de profil" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-brand-600 dark:text-brand-300">{initials}</span>
                )}
              </div>
              <div className="mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {user.first_name} {user.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {user.position && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.position}</span>
                  )}
                  {user.position && user.role?.name && (
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                  {user.role?.name && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {user.role.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit button */}
            <button onClick={openModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm self-start sm:self-auto">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z" />
              </svg>
              Modifier le profil
            </button>
          </div>

          {/* Quick info row */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {user.email && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {user.phone}
              </span>
            )}
            {(user.city || user.country) && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[user.city, user.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Informations personnelles */}
          <Section title="Informations personnelles" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem label="Prénom" value={user.first_name} />
              <InfoItem label="Nom" value={user.last_name} />
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Téléphone" value={user.phone} />
              <InfoItem label="Poste" value={user.position} />
              <InfoItem label="Rôle" value={user.role?.name} />
            </div>
            {user.bio && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Bio</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{user.bio}</p>
              </div>
            )}
          </Section>

          {/* Adresse */}
          <Section title="Adresse & Localisation" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem label="Pays" value={user.country} />
              <InfoItem label="Ville" value={user.city} />
              <InfoItem label="Code postal" value={user.postal_code} />
              <InfoItem label="N° fiscal (TAX ID)" value={user.tax_id} />
            </div>
          </Section>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-5">

          {/* Réseaux sociaux */}
          <Section title="Réseaux sociaux" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }>
            <div className="space-y-3">
              <SocialLink href={user.linkedin} label="LinkedIn" icon={
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                </svg>
              } />
              <SocialLink href={user.twitter} label="X (Twitter)" icon={
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              } />
              <SocialLink href={user.facebook} label="Facebook" icon={
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              } />
              <SocialLink href={user.instagram} label="Instagram" icon={
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              } />
            </div>
          </Section>

          {/* Entreprise */}
          {user.company && (
            <Section title="Entreprise" icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }>
              <InfoItem label="Nom" value={user.company?.name} />
              {user.company?.email && <InfoItem label="Email" value={user.company?.email} />}
            </Section>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-2xl">
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden w-full">
          {/* Modal header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Modifier mon profil</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Mettez à jour vos informations personnelles</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-5">

              {/* Tab: Informations */}
              {activeTab === "info" && (
                <>
                  {/* Photo */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white dark:border-gray-700 bg-brand-100 flex items-center justify-center cursor-pointer flex-shrink-0 shadow"
                      onClick={() => fileInputRef.current?.click()}>
                      {photoPreview
                        ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        : <span className="text-xl font-bold text-brand-600">{initials}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Photo de profil</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-xs text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-full px-3 py-1 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        Choisir une photo
                      </button>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · max 5MB</p>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} className="hidden" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Prénom *">
                      <input className={inputCls} {...register("first_name")} placeholder="Prénom" />
                      {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                    </FormField>
                    <FormField label="Nom *">
                      <input className={inputCls} {...register("last_name")} placeholder="Nom" />
                      {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                    </FormField>
                    <FormField label="Téléphone">
                      <input className={inputCls} {...register("phone")} placeholder="+212 6 12 34 56 78" />
                    </FormField>
                    <FormField label="Poste / Position">
                      <input className={inputCls} {...register("position")} placeholder="Ex: Développeur Full Stack" />
                    </FormField>
                  </div>
                  <FormField label="Bio">
                    <textarea className={`${inputCls} resize-none`} rows={3} {...register("bio")} placeholder="Quelques mots sur vous..." />
                  </FormField>
                </>
              )}

              {/* Tab: Réseaux sociaux */}
              {activeTab === "social" && (
                <div className="space-y-4">
                  {[
                    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/votre-profil" },
                    { key: "twitter", label: "X (Twitter)", placeholder: "https://twitter.com/votre-compte" },
                    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/votre-page" },
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/votre-compte" },
                  ].map(({ key, label, placeholder }) => (
                    <FormField key={key} label={label}>
                      <input className={inputCls} {...register(key as keyof FormData)} placeholder={placeholder} />
                    </FormField>
                  ))}
                </div>
              )}

              {/* Tab: Adresse */}
              {activeTab === "address" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Pays">
                    <input className={inputCls} {...register("country")} placeholder="Ex: Maroc" />
                  </FormField>
                  <FormField label="Ville">
                    <input className={inputCls} {...register("city")} placeholder="Ex: Casablanca" />
                  </FormField>
                  <FormField label="Code postal">
                    <input className={inputCls} {...register("postal_code")} placeholder="Ex: 20000" />
                  </FormField>
                  <FormField label="N° fiscal (TAX ID)">
                    <input className={inputCls} {...register("tax_id")} placeholder="Ex: TAX-123456" />
                  </FormField>
                </div>
              )}

              {/* Tab: Sécurité */}
              {activeTab === "security" && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe.
                  </div>
                  <FormField label="Mot de passe actuel">
                    <div className="relative">
                      <input className={inputCls} type={showCurrentPwd ? "text" : "password"} {...register("current_password")} placeholder="Mot de passe actuel" />
                      <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCurrentPwd ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
                      </button>
                    </div>
                  </FormField>
                  <FormField label="Nouveau mot de passe">
                    <div className="relative">
                      <input className={inputCls} type={showNewPwd ? "text" : "password"} {...register("new_password")} placeholder="Nouveau mot de passe" />
                      <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showNewPwd ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">8+ caractères, majuscule, chiffre et caractère spécial</p>
                  </FormField>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsOpen(false)} disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                Annuler
              </button>
              <button type="submit" disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50">
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

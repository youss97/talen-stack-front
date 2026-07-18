"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { useGetCompanyByIdQuery, useUpdateCompanyMutation } from "@/lib/services/companyApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function PublicSiteSettingsPage() {
  const t = useTranslations("settings.publicSite");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyId = (user as unknown as { company?: { id?: string } } | null)?.company?.id || "";

  const { data: company, isLoading } = useGetCompanyByIdQuery(companyId, { skip: !companyId });
  const [updateCompany, { isLoading: saving }] = useUpdateCompanyMutation();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [form, setForm] = useState({ slug: "", public_description: "", public_brand_color: "#8AB925" });

  const addToast = (variant: ToastItem["variant"], title: string, message?: string) =>
    setToasts((p) => [...p, { id: Date.now().toString(), variant, title, message }]);
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  useEffect(() => {
    if (user && user.role?.code !== "super_admin" && user.company?.parent_company_id !== null) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (company) {
      const c = company as unknown as Record<string, string>;
      setForm({
        slug: c.slug || "",
        public_description: c.public_description || "",
        public_brand_color: c.public_brand_color || "#8AB925",
      });
    }
  }, [company]);

  const save = async () => {
    if (!companyId) return;
    try {
      const fd = new FormData();
      fd.append("slug", form.slug);
      fd.append("public_description", form.public_description);
      fd.append("public_brand_color", form.public_brand_color);
      await updateCompany({ id: companyId, data: fd }).unwrap();
      addToast("success", t("toasts.savedTitle"), t("toasts.savedMessage"));
    } catch (err) {
      addToast("error", t("toasts.errorTitle"), getApiErrorMessage(err, t("toasts.errorMessage")));
    }
  };

  const publicUrl = form.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/company/${form.slug}` : "";

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("slugLabel")}</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder={t("slugPlaceholder")} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
          {publicUrl && (
            <p className="mt-1.5 text-xs text-gray-500">
              {t("linkLabel")} : <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">{publicUrl}</a>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("descriptionLabel")}</label>
          <textarea value={form.public_description} onChange={(e) => setForm({ ...form, public_description: e.target.value })} rows={4} placeholder={t("descriptionPlaceholder")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("brandColorLabel")}</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.public_brand_color} onChange={(e) => setForm({ ...form, public_brand_color: e.target.value })} className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer" />
            <input value={form.public_brand_color} onChange={(e) => setForm({ ...form, public_brand_color: e.target.value })} className="h-10 w-32 rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:border-gray-700" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </div>
  );
}

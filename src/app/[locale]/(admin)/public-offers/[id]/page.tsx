"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { RootState } from "@/lib/store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import {
  useGetPublicJobOfferByIdQuery,
  useGetPublicApplicationsByRequestQuery,
  useGetRequestResponsibleUsersQuery,
  useConvertPublicApplicationMutation,
  useDeletePublicApplicationMutation,
} from "@/lib/services/publicJobOfferApi";
import ApplicationsList from "@/components/public-offers/ApplicationsList";
import ConversionLoader from "@/components/public-offers/ConversionLoader";
import TemplatePickerModal from "@/components/email/TemplatePickerModal";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { getCurrencyByCode, DEFAULT_CURRENCY } from "@/lib/currencies";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import type { PublicApplication } from "@/types/publicJobOffer";

export default function PublicOfferDetailPage() {
  const t = useTranslations("publicOffers.detail");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [referrerFilter, setReferrerFilter] = useState<string>("all");

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const roleCode = ((currentUser as any)?.role?.code || "").toUpperCase();
  const isAdmin = roleCode.includes("ADMIN");

  const { data: offer, isLoading } = useGetPublicJobOfferByIdQuery(id);
  const { data: publicApps = [] } = useGetPublicApplicationsByRequestQuery(
    { requestId: id, referrerId: referrerFilter === "all" ? undefined : referrerFilter },
    { skip: !id }
  );
  const { data: responsibleUsers = [] } = useGetRequestResponsibleUsersQuery(id, { skip: !id || !isAdmin });
  const [convertPublicApp] = useConvertPublicApplicationMutation();
  const [deletePublicApp] = useDeletePublicApplicationMutation();
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertDone, setConvertDone] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; application: PublicApplication | null }>({
    isOpen: false,
    application: null,
  });
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const [confirmConvert, setConfirmConvert] = useState<{ isOpen: boolean; appId: string | null }>({
    isOpen: false,
    appId: null,
  });

  const performConvert = async (appId: string) => {
    setConvertingId(appId);
    setConvertDone(false);
    try {
      const result = await convertPublicApp({ id: appId, requestId: id }).unwrap();
      // Afficher brièvement les étapes validées avant de fermer l'overlay
      setConvertDone(true);
      await new Promise((r) => setTimeout(r, 900));
      if (result.extraction_warning) {
        addToast(
          "warning",
          t("toast.convertedWithWarning"),
          result.extraction_warning
        );
      } else {
        addToast("success", t("toast.converted"), t("toast.convertedMessage"));
      }
    } catch (e) {
      addToast("error", t("toast.error"), getApiErrorMessage(e, t("toast.convertError")));
    } finally {
      setConvertingId(null);
      setConvertDone(false);
    }
  };

  const handleConvertClick = (appId: string) => {
    setConfirmConvert({ isOpen: true, appId });
  };

  const handleConfirmConvert = async () => {
    const appId = confirmConvert.appId;
    setConfirmConvert({ isOpen: false, appId: null });
    if (appId) await performConvert(appId);
  };

  const handleDeleteClick = (application: PublicApplication) => {
    setConfirmDelete({ isOpen: true, application });
  };

  const handleConfirmDelete = async () => {
    const application = confirmDelete.application;
    if (!application) return;
    // Relecture/ajustement systématique de l'email envoyé avant suppression.
    setConfirmDelete({ isOpen: false, application });
    setShowTemplatePicker(true);
  };

  const performDelete = async (
    application: PublicApplication,
    payload?: { templateId?: string; subject: string; body_html: string }
  ) => {
    setDeletingId(application.id);
    try {
      await deletePublicApp({
        id: application.id,
        requestId: id,
        templateId: payload?.templateId,
        subject: payload?.subject,
        body_html: payload?.body_html,
      }).unwrap();
      addToast("success", t("toast.deleted"), t("toast.deletedMessage"));
      setConfirmDelete({ isOpen: false, application: null });
      setShowTemplatePicker(false);
    } catch (e) {
      addToast("error", t("toast.error"), getApiErrorMessage(e, t("toast.deleteError")));
    } finally {
      setDeletingId(null);
    }
  };

  const publicCompanySlug = offer?.client?.company?.slug;
  const publicUrl = offer?.public_slug && typeof window !== "undefined"
    ? `${window.location.origin}${publicCompanySlug ? `/${publicCompanySlug}` : "/apply"}/${offer.public_slug}${currentUser?.id ? `?ref=${currentUser.id}` : ""}`
    : "";

  const addToast = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    addToast("success", t("toast.linkCopied"), t("toast.linkCopiedMessage"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!offer || !offer.is_public) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-gray-500">{t("notFound")}</p>
          <Button onClick={() => router.push("/public-offers")} className="mt-4">
            {t("backToList")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConversionLoader active={!!convertingId} done={convertDone} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {offer.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {offer.client?.name || 'N/A'} • {offer.location}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/public-offers")}>
          {t("back")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de l'offre */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("offerDetails")}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge color="success" variant="light">
                  {t("publicBadge")}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {offer.contract_type}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("description")}
                </h3>
                <div
                  className="text-sm text-gray-600 dark:text-gray-400 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(offer.description) }}
                />
              </div>

              {(offer.min_salary || offer.max_salary) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("salary")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      const symbol = getCurrencyByCode(offer.currency || DEFAULT_CURRENCY)?.symbol || offer.currency || "";
                      return offer.min_salary && offer.max_salary
                        ? t("salaryRange", { min: offer.min_salary, max: offer.max_salary, symbol })
                        : offer.min_salary
                          ? t("salaryFrom", { amount: offer.min_salary, symbol })
                          : t("salaryUpTo", { amount: offer.max_salary ?? 0, symbol });
                    })()}
                  </p>
                </div>
              )}

              {offer.min_experience && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("experience")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("experienceMin", { years: offer.min_experience })}
                  </p>
                </div>
              )}

              {offer.required_skills && offer.required_skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("skills")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {offer.required_skills.map((skill: unknown, index: number) => {
                      const label = typeof skill === "string" ? skill : (skill as { name?: string })?.name;
                      if (!label) return null;
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {offer.deadline && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("deadline")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {offer.deadline && !isNaN(new Date(offer.deadline).getTime())
                      ? new Date(offer.deadline).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("stats")}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {offer.public_views_count || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t("views")}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {offer.published_at && !isNaN(new Date(offer.published_at).getTime())
                    ? new Date(offer.published_at).toLocaleDateString('fr-FR')
                    : t("notAvailable")
                  }
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t("publishedDate")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Lien public */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("publicLink")}
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg break-all text-sm text-gray-700 dark:text-gray-300">
                {publicUrl}
              </div>

              <Button onClick={copyLink} variant="outline" className="w-full">
                {t("copyLink")}
              </Button>

              <Button
                onClick={() => window.open(publicUrl, "_blank")}
                variant="outline"
                className="w-full"
              >
                {t("preview")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidatures de l'offre publique (séparées des candidatures) */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("receivedApplications")}
            <span className="ms-2 text-sm text-gray-400">({publicApps.length})</span>
          </h2>
          {isAdmin && responsibleUsers.length > 0 && (
            <select
              value={referrerFilter}
              onChange={(e) => setReferrerFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10"
            >
              <option value="all">{t("filters.allReferrers")}</option>
              {responsibleUsers.map((u) => (
                <option key={u.id} value={u.id}>{`${u.first_name} ${u.last_name}`}</option>
              ))}
            </select>
          )}
        </div>
        <ApplicationsList
          applications={publicApps}
          offerTitle={offer.title}
          onConvert={handleConvertClick}
          convertingId={convertingId}
          onDelete={handleDeleteClick}
          deletingId={deletingId}
        />
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, application: null })}
        onConfirm={handleConfirmDelete}
        title={t("deleteApplication.title")}
        message={t("deleteApplication.message", { name: `${confirmDelete.application?.first_name ?? ""} ${confirmDelete.application?.last_name ?? ""}`.trim() })}
        confirmText={t("deleteApplication.confirm")}
        cancelText={t("deleteApplication.cancel")}
        variant="danger"
        isLoading={!!deletingId}
      />

      <TemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={() => { setShowTemplatePicker(false); setConfirmDelete({ isOpen: false, application: null }); }}
        type="PUBLIC_APPLICATION_DELETED"
        title={t("deleteApplication.pickTemplateTitle")}
        isConfirming={!!deletingId}
        onConfirm={(payload) => {
          if (confirmDelete.application) performDelete(confirmDelete.application, payload);
        }}
      />

      <ConfirmModal
        isOpen={confirmConvert.isOpen}
        onClose={() => setConfirmConvert({ isOpen: false, appId: null })}
        onConfirm={handleConfirmConvert}
        title={t("convertApplication.title")}
        message={t("convertApplication.message")}
        confirmText={t("convertApplication.confirm")}
        cancelText={t("convertApplication.cancel")}
        variant="info"
        isLoading={!!convertingId}
      />
    </div>
  );
}

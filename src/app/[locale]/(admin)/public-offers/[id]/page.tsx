"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import {
  useGetPublicJobOfferByIdQuery,
  useGetPublicApplicationsByRequestQuery,
  useConvertPublicApplicationMutation,
  useDeletePublicApplicationMutation,
} from "@/lib/services/publicJobOfferApi";
import ApplicationsList from "@/components/public-offers/ApplicationsList";
import ConversionLoader from "@/components/public-offers/ConversionLoader";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { getCurrencyByCode, DEFAULT_CURRENCY } from "@/lib/currencies";
import type { PublicApplication } from "@/types/publicJobOffer";

export default function PublicOfferDetailPage() {
  const t = useTranslations("publicOffers.detail");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const { data: offer, isLoading } = useGetPublicJobOfferByIdQuery(id);
  const { data: publicApps = [] } = useGetPublicApplicationsByRequestQuery(id, { skip: !id });
  const [convertPublicApp] = useConvertPublicApplicationMutation();
  const [deletePublicApp] = useDeletePublicApplicationMutation();
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertDone, setConvertDone] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; application: PublicApplication | null }>({
    isOpen: false,
    application: null,
  });

  const handleConvert = async (appId: string) => {
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

  const handleDeleteClick = (application: PublicApplication) => {
    setConfirmDelete({ isOpen: true, application });
  };

  const handleConfirmDelete = async () => {
    const application = confirmDelete.application;
    if (!application) return;
    setDeletingId(application.id);
    try {
      await deletePublicApp({ id: application.id, requestId: id }).unwrap();
      addToast("success", t("toast.deleted"), t("toast.deletedMessage"));
      setConfirmDelete({ isOpen: false, application: null });
    } catch (e) {
      addToast("error", t("toast.error"), getApiErrorMessage(e, t("toast.deleteError")));
    } finally {
      setDeletingId(null);
    }
  };

  const publicUrl = offer?.public_slug && typeof window !== "undefined"
    ? `${window.location.origin}/apply/${offer.public_slug}`
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
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {offer.description}
                </p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("receivedApplications")}
            <span className="ms-2 text-sm text-gray-400">({publicApps.length})</span>
          </h2>
        </div>
        <ApplicationsList
          applications={publicApps}
          offerTitle={offer.title}
          onConvert={handleConvert}
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
    </div>
  );
}

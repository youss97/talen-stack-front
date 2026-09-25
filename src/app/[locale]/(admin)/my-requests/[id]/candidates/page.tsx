"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useGetCandidatesForRequestQuery, useGetManagerRequestByIdQuery, useUpdateManagerOwnRequestMutation } from "@/lib/services/clientManagerApi";
import { useGetCvSourcesQuery } from "@/lib/services/cvSourceApi";
import { useCreateFeedbackMutation } from "@/lib/services/recruiterApi";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import FeedbackModal from "@/components/recruiter/FeedbackModal";
import FeedbackListModal from "@/components/recruiter/FeedbackListModal";
import CandidateApplicationDetailModal from "@/components/recruiter/CandidateApplicationDetailModal";
import ApplicationRequestDetailModal from "@/components/applicationRequest/ApplicationRequestDetailModal";
import ManagerRequestFormModal from "@/components/applicationRequest/ManagerRequestFormModal";
import Pagination from "@/components/tables/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import { openCvInNewTab, openAnonymizedCvInNewTab } from "@/utils/cvView";
import { getFeedbackCardColor } from "@/utils/feedbackColors";
import type { Recruiter } from "@/types/recruiter";
import type { ApplicationRequest } from "@/types/applicationRequest";
import { Users, Eye, Pencil, RefreshCw, ClipboardList, MessageCircle, FileText, LayoutGrid, Info } from "lucide-react";

export default function RequestCandidatesPage() {
  const t = useTranslations("myRequests.candidates");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = params.id as string;
  // Venant d'une notification : ouvrir directement le détail de cette candidature
  const targetApplicationId = searchParams.get("applicationId");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const { data: cvSourcesData } = useGetCvSourcesQuery({ is_active: true });
  const cvSources = cvSourcesData?.data || [];
  const [selectedCandidate, setSelectedCandidate] = useState<Recruiter | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isFeedbackListModalOpen, setIsFeedbackListModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<Recruiter | null>(null);
  const [isOfferDetailOpen, setIsOfferDetailOpen] = useState(false);
  const [isOfferEditOpen, setIsOfferEditOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // Détail de l'offre (pour le bouton "Détails de l'offre")
  const { data: offer } = useGetManagerRequestByIdQuery(requestId, { skip: !requestId });
  const [updateOwnRequest, { isLoading: isUpdatingOffer }] = useUpdateManagerOwnRequestMutation();

  const { data, isLoading, isFetching, refetch } = useGetCandidatesForRequestQuery({
    requestId,
    page,
    // Venant d'une notification pour une candidature précise : charger toute la liste (pas de pagination)
    // pour la retrouver quelle que soit sa page normale, puis ouvrir directement son détail.
    limit: targetApplicationId ? 1000 : 5,
    search: debouncedSearch,
    step: statusFilter || undefined,
    source: sourceFilter || undefined,
  }, { pollingInterval: 30000 });

  // Auto-ouverture du détail de la candidature ciblée par la notification (une seule fois)
  useEffect(() => {
    if (!targetApplicationId || !data?.data?.length) return;
    const target = data.data.find((c) => c.id === targetApplicationId);
    if (target) {
      setDetailCandidate(target);
      setIsDetailModalOpen(true);
      // Nettoyer l'URL pour ne pas rouvrir la modale à chaque re-render/rafraîchissement
      router.replace(`/my-requests/${requestId}/candidates`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetApplicationId, data]);

  const [createFeedback, { isLoading: isCreatingFeedback }] = useCreateFeedbackMutation();
  const [revealRequestedIds, setRevealRequestedIds] = useState<string[]>([]);

  const handleRequestIdentityReveal = async (candidate: Recruiter) => {
    try {
      await createFeedback({
        id: candidate.id,
        title: t("identityReveal.feedbackTitle"),
        description: t("identityReveal.feedbackDescription"),
        step: candidate.current_step || "Proposé",
      }).unwrap();
      setRevealRequestedIds((prev) => [...prev, candidate.id]);
    } catch {
      alert(t("identityReveal.error"));
    }
  };

  const handleOpenFeedbackListModal = (candidate: Recruiter) => {
    setSelectedCandidate(candidate);
    setIsFeedbackListModalOpen(true);
  };

  const handleEditOffer = async (formData: any) => {
    if (!offer) return;
    try {
      await updateOwnRequest({ id: offer.id, data: formData }).unwrap();
      setIsOfferEditOpen(false);
    } catch (error) {
      console.error("Erreur lors de la modification de l'offre:", error);
      throw error;
    }
  };

  const handleCreateFeedback = async (title: string, description: string, audio?: Blob | null) => {
    if (!selectedCandidate) return;

    try {
      await createFeedback({
        id: selectedCandidate.id,
        title,
        description,
        audio,
      }).unwrap();
      
      setIsFeedbackModalOpen(false);
      
      // Rafraîchir les données
      const updatedData = await refetch();
      
      // Mettre à jour le candidat sélectionné
      const updatedCandidate = updatedData.data?.data.find((c: any) => c.id === selectedCandidate.id);
      if (updatedCandidate) {
        setSelectedCandidate(updatedCandidate);
      }
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/my-requests")}
            className="mb-3"
          >
            ← {t("backToOffers")}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
            {offer?.title && (
              <span className="text-brand-600 dark:text-brand-400"> — {offer.title}</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOfferDetailOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Eye size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
            {t("offerDetails")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/my-requests/${requestId}/kanban`)}
            className="inline-flex items-center gap-1.5"
          >
            <LayoutGrid size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
            {t("kanbanView")}
          </Button>
          {offer?.is_owner && (
            <Button
              size="sm"
              onClick={() => setIsOfferEditOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <Pencil size={16} strokeWidth={1.8} className="icon-glow" />
              {t("editOffer")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5"
          >
            {isFetching ? "..." : (
              <>
                <RefreshCw size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                {t("refresh")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <InputField
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="">{t("allStatuses")}</option>
              {/* Le client ne voit que les étapes du workflow (pas le statut interne RH) + les statuts de clôture */}
              {(offer?.workflow_steps || [])
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((step) => (
                  <option key={step.name} value={step.name}>
                    {step.name}
                  </option>
                ))}
              <option value="Accepté">{t("terminalSteps.accepted")}</option>
              <option value="KO">{t("terminalSteps.ko")}</option>
              <option value="Désistement">{t("terminalSteps.withdrawn")}</option>
            </select>
          </div>
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="">{t("allSources")}</option>
              {cvSources.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="mx-auto text-gray-400 icon-glow" size={48} strokeWidth={1.8} />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t("empty.title")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {search || statusFilter
              ? t("empty.filtered")
              : t("empty.noCandidates")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.data.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {candidate.cv?.candidate_first_name} {candidate.cv?.candidate_last_name}
                    </h3>
                    {/* Le client ne voit que l'étape (pas le statut interne RH) */}
                    {candidate.current_step && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {candidate.current_step}
                      </span>
                    )}
                    {candidate.qualification_score != null && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300"
                        title={t("qualificationScoreHint")}
                      >
                        {t("qualificationScoreBadge", { score: candidate.qualification_score })}
                        <Info size={13} strokeWidth={2} className="opacity-70" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {(candidate.adjusted_experience ?? candidate.cv?.total_experience) != null && (
                      <div className="flex items-center gap-1">
                        <ClipboardList className="icon-glow" size={16} strokeWidth={1.8} />
                        <span>{t("experienceYears", { years: (candidate.adjusted_experience ?? candidate.cv?.total_experience)! })}</span>
                      </div>
                    )}
                    {candidate.availability_type && (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="icon-glow" size={16} strokeWidth={1.8} />
                        <span>
                          {t.has(`availabilityOptions.${candidate.availability_type}`)
                            ? t(`availabilityOptions.${candidate.availability_type}`)
                            : candidate.availability_type}
                        </span>
                      </div>
                    )}
                    {!candidate.desired_salary_deferred && candidate.salary_expectation != null && (
                      <div className="flex items-center gap-1">
                        <span>{t("desiredSalaryValue", { amount: candidate.salary_expectation.toLocaleString("fr-FR"), currency: candidate.currency || "MAD" })}</span>
                      </div>
                    )}
                    {!candidate.desired_salary_deferred && candidate.daily_rate_expectation != null && (
                      <div className="flex items-center gap-1">
                        <span>{t("desiredDailyRateValue", { amount: candidate.daily_rate_expectation.toLocaleString("fr-FR"), currency: candidate.currency || "MAD" })}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {candidate.cv?.skills && candidate.cv.skills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("skillsLabel")}</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.cv.skills.slice(0, 8).map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.cv.skills.length > 8 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            +{candidate.cv.skills.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedbacks Section — même UI/UX que côté RH (nom, rôle, couleur par rôle, tri par date) */}
                  {(() => {
                    // Le backend renvoie déjà les feedbacks triés created_at DESC (le plus récent en premier)
                    const allFeedbacks = candidate.feedbacks || [];
                    if (allFeedbacks.length === 0) return null;
                    const clientFeedbacks = allFeedbacks.filter((f) =>
                      !f.created_by?.role?.code || f.created_by.role.code.startsWith('CLIENT_MANAGER_')
                    );
                    const rhFeedbacks = allFeedbacks.filter((f) =>
                      f.created_by?.role?.code && !f.created_by.role.code.startsWith('CLIENT_MANAGER_')
                    );
                    const renderFeedbackCard = (feedback: (typeof allFeedbacks)[number]) => (
                      <div
                        key={feedback.id}
                        className={`rounded-lg p-3 border-s-4 ${getFeedbackCardColor(feedback)}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{feedback.title}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ms-4">{formatDateTime(feedback.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">{feedback.description}</p>
                        {feedback.created_by && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{feedback.created_by.first_name} {feedback.created_by.last_name}</span>
                            {feedback.created_by.role && (
                              <><span>•</span><span>{feedback.created_by.role.name}</span></>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    return (
                    <div className="mb-4 space-y-3">
                      {/* Évaluations RH */}
                      {rhFeedbacks.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5">
                              <ClipboardList size={14} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                              {t("feedback.hrEvaluations", { count: rhFeedbacks.length })}
                            </p>
                            {rhFeedbacks.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCandidate({ ...candidate, feedbacks: allFeedbacks });
                                  setIsFeedbackListModalOpen(true);
                                }}
                              >
                                {t("feedback.viewAll")}
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {rhFeedbacks.slice(0, 1).map(renderFeedbackCard)}
                          </div>
                        </div>
                      )}
                      {/* Mes feedbacks (client) */}
                      {clientFeedbacks.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5">
                              <MessageCircle size={14} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                              {t("feedback.myFeedbacks", { count: clientFeedbacks.length })}
                            </p>
                            {clientFeedbacks.length > 2 && rhFeedbacks.length === 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCandidate({ ...candidate, feedbacks: allFeedbacks });
                                  setIsFeedbackListModalOpen(true);
                                }}
                              >
                                {t("feedback.viewAll")}
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {clientFeedbacks.slice(0, 2).map(renderFeedbackCard)}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailCandidate(candidate);
                    setIsDetailModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Eye size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                  {t("consultApplication")}
                </Button>
                {/* Affichage conditionnel du CV selon is_anonymized */}
                {candidate.is_anonymized ? (
                  // Candidature anonyme: afficher uniquement le CV anonymisé
                  candidate.cv?.id && (
                    <Button
                      onClick={() => candidate.cv?.id && openAnonymizedCvInNewTab(candidate.cv.id).then((ok) => {
                        if (!ok) alert(t("errors.cvOpenFailed"));
                      })}
                      size="sm"
                      variant="outline"
                      className="inline-flex items-center gap-1.5"
                    >
                      <FileText size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                      {t("viewCv")}
                    </Button>
                  )
                ) : null}
                {candidate.is_anonymized && (
                  <Button
                    onClick={() => handleRequestIdentityReveal(candidate)}
                    size="sm"
                    variant="outline"
                    disabled={isCreatingFeedback || revealRequestedIds.includes(candidate.id)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Users size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                    {revealRequestedIds.includes(candidate.id) ? t("identityReveal.requested") : t("identityReveal.button")}
                  </Button>
                )}
                {!candidate.is_anonymized && (
                  // Candidature non anonyme: afficher le CV normal — uniquement "Voir", pas de
                  // téléchargement côté client.
                  candidate.cv?.id && (
                    <Button
                      onClick={() => candidate.cv?.id && openCvInNewTab(candidate.cv.id).then((ok) => {
                        if (!ok) alert(t("errors.cvOpenFailed"));
                      })}
                      size="sm"
                      variant="outline"
                      className="inline-flex items-center gap-1.5"
                    >
                      <Eye size={16} strokeWidth={1.8} className="icon-glow text-gray-500 dark:text-gray-400" />
                      {t("viewCv")}
                    </Button>
                  )
                )}
                <Button
                  onClick={() => {
                    setSelectedCandidate(candidate);
                    setIsFeedbackModalOpen(true);
                  }}
                  size="sm"
                >
                  {t("addFeedback")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - Always visible */}
      {data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <Pagination
            currentPage={page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
            itemsPerPage={5}
          />
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setSelectedCandidate(null);
        }}
        onSubmit={handleCreateFeedback}
        isLoading={isCreatingFeedback}
      />

      {/* Feedback List Modal */}
      <FeedbackListModal
        isOpen={isFeedbackListModalOpen}
        onClose={() => {
          setIsFeedbackListModalOpen(false);
          setSelectedCandidate(null);
        }}
        feedbacks={selectedCandidate?.feedbacks || []}
        isLoading={false}
        onCreateFeedback={handleCreateFeedback}
        isCreating={isCreatingFeedback}
        canAddFeedback={true}
      />

      {/* Candidate Application Detail Modal */}
      <CandidateApplicationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailCandidate(null);
        }}
        candidate={detailCandidate}
        canEditStep
        onUpdated={() => refetch()}
      />

      {/* Détails de l'offre */}
      <ApplicationRequestDetailModal
        isOpen={isOfferDetailOpen}
        onClose={() => setIsOfferDetailOpen(false)}
        applicationRequest={offer as ApplicationRequest | null}
        isLoading={false}
      />

      {/* Modification de l'offre (si le client en est le créateur) */}
      {offer?.is_owner && (
        <ManagerRequestFormModal
          isOpen={isOfferEditOpen}
          onClose={() => setIsOfferEditOpen(false)}
          onSubmit={handleEditOffer}
          initialData={offer as any}
          isLoading={isUpdatingOffer}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCandidatesForRequestQuery } from "@/lib/services/clientManagerApi";
import { useCreateFeedbackMutation } from "@/lib/services/recruiterApi";
import { useGetApplicationStatusesQuery } from "@/lib/services/applicationStatusApi";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import FeedbackModal from "@/components/recruiter/FeedbackModal";
import FeedbackListModal from "@/components/recruiter/FeedbackListModal";
import Pagination from "@/components/tables/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import type { Recruiter } from "@/types/recruiter";

export default function RequestCandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Recruiter | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isFeedbackListModalOpen, setIsFeedbackListModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // Récupérer les statuts de candidature
  const { data: applicationStatusesData } = useGetApplicationStatusesQuery({
    page: 1,
    limit: 100,
    is_active: true
  });

  const applicationStatuses = applicationStatusesData?.data || [];

  const { data, isLoading, isFetching, refetch } = useGetCandidatesForRequestQuery({
    requestId,
    page,
    limit: 5,
    search: debouncedSearch,
    status: statusFilter || undefined,
  });

  const [createFeedback, { isLoading: isCreatingFeedback }] = useCreateFeedbackMutation();

  const handleOpenFeedbackListModal = (candidate: Recruiter) => {
    setSelectedCandidate(candidate);
    setIsFeedbackListModalOpen(true);
  };

  const handleCreateFeedback = async (title: string, description: string) => {
    if (!selectedCandidate) return;
    
    try {
      await createFeedback({
        id: selectedCandidate.id,
        title,
        description,
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

  const getStatusBadge = (status: string) => {
    const statusObj = applicationStatuses.find(s => s.name === status);
    
    if (!statusObj) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
          {status}
        </span>
      );
    }

    // Mapper les couleurs selon le type de statut
    let className = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    
    switch (statusObj.color?.toLowerCase()) {
      case "blue":
      case "info":
        className = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        break;
      case "yellow":
      case "warning":
        className = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        break;
      case "green":
      case "success":
        className = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        break;
      case "red":
      case "error":
      case "danger":
        className = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        break;
      case "purple":
        className = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        break;
      case "indigo":
        className = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {statusObj.name}
      </span>
    );
  };

  const getFeedbackCardColor = (feedback: any) => {
    const roleCode = feedback?.created_by?.role?.code;
    
    if (roleCode?.startsWith('CLIENT_MANAGER_')) {
      return "bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600";
    } else if (roleCode === 'rh' || roleCode === 'admin') {
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600";
    } else {
      return "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600";
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
            ← Retour aux offres
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Candidats Proposés
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consultez les candidats et ajoutez vos commentaires
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField
              placeholder="Rechercher par nom, email..."
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
              <option value="">Tous les statuts</option>
              {applicationStatuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name}
                </option>
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
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucun candidat trouvé
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {search || statusFilter
              ? "Essayez de modifier vos filtres"
              : "Aucun candidat n'a encore été proposé pour cette offre"}
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
                    {getStatusBadge(candidate.status)}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {candidate.cv?.candidate_email && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{candidate.cv.candidate_email}</span>
                      </div>
                    )}

                    {candidate.cv?.candidate_phone && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{candidate.cv.candidate_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {candidate.cv?.skills && candidate.cv.skills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Compétences:</p>
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

                  {/* Feedbacks Section */}
                  {candidate.feedbacks && candidate.feedbacks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          💭 Feedbacks ({candidate.feedbacks.length})
                        </p>
                        {candidate.feedbacks.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenFeedbackListModal(candidate)}
                          >
                            Voir tous
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {candidate.feedbacks.slice(0, 2).map((feedback: any) => (
                          <div 
                            key={feedback.id} 
                            className={`rounded-lg p-3 border-l-4 ${getFeedbackCardColor(feedback)}`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {feedback.title}
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(feedback.created_at).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                              {feedback.description}
                            </p>
                            {feedback.created_by && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">
                                  {feedback.created_by.first_name} {feedback.created_by.last_name}
                                </span>
                                {feedback.created_by.role && (
                                  <>
                                    <span>•</span>
                                    <span>{feedback.created_by.role.name}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {/* Affichage conditionnel du CV selon is_anonymized */}
                {candidate.is_anonymized ? (
                  // Candidature anonyme: afficher uniquement le CV anonymisé
                  candidate.cv?.id && (
                    <Button
                      onClick={async () => {
                        try {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                          const token = localStorage.getItem('token');
                          
                          console.log('📥 Téléchargement CV anonymisé:', {
                            cvId: candidate.cv!.id,
                            url: `${apiUrl}/cvs/${candidate.cv!.id}/anonymized`
                          });

                          const response = await fetch(`${apiUrl}/cvs/${candidate.cv!.id}/anonymized`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          console.log('📡 Réponse:', {
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok
                          });
                          
                          if (!response.ok) {
                            const errorText = await response.text();
                            console.error('❌ Erreur backend:', errorText);
                            throw new Error(`Erreur ${response.status}: ${errorText}`);
                          }
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `cv-anonymise-${candidate.cv!.id.substring(0, 8)}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          
                          console.log('✅ CV téléchargé avec succès');
                        } catch (error: any) {
                          console.error('❌ Erreur complète:', error);
                          alert(`Erreur lors du téléchargement du CV: ${error.message}`);
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      📄 Voir le CV
                    </Button>
                  )
                ) : (
                  // Candidature non anonyme: afficher le CV normal
                  candidate.cv?.file_path && (
                    <Button
                      onClick={() => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                        window.open(`${apiUrl}/${candidate.cv!.file_path}`, '_blank');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      📄 Voir le CV
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
                  Ajouter un feedback
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
            totalItems={data.pagination.total}
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
    </div>
  );
}

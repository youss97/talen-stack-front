"use client";
import { useState } from "react";
import { useGetInterviewsQuery, useCreateInterviewMutation } from "@/lib/services/interviewApi";
import CreateInterviewSimpleModal from "@/components/interviews/CreateInterviewSimpleModal";
import InterviewDetailModal from "@/components/interviews/InterviewDetailModal";
import Pagination from "@/components/tables/Pagination";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast/Toast";
import Button from "@/components/ui/button/Button";
import type { Interview, CreateInterviewRequest } from "@/types/interview";

export default function InterviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { toasts, removeToast, success, error: showError } = useToast();
  const { data, isLoading, error } = useGetInterviewsQuery({
    page,
    limit: 5,
    status: statusFilter || undefined,
  });
  const [createInterview, { isLoading: isCreating }] = useCreateInterviewMutation();

  const interviews = data?.data || [];
  const totalInterviews = data?.pagination?.total || 0;

  const handleCreateInterview = async (applicationId: string, data: CreateInterviewRequest) => {
    try {
      const result = await createInterview({
        applicationId,
        data,
      }).unwrap();
      
      console.log('✅ Entretien créé:', result);
      success(
        "Entretien créé",
        data.send_email_automatically 
          ? 'Un email a été envoyé au candidat' 
          : 'L\'entretien a été créé avec succès'
      );
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error("❌ Error creating interview:", err);
      const errorMessage = err?.data?.message || err?.message || 'Erreur lors de la création de l\'entretien';
      showError("Erreur", errorMessage);
      throw err;
    }
  };

  const handleViewInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      rescheduled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    };

    const labels: Record<string, string> = {
      scheduled: 'Planifié',
      completed: 'Terminé',
      cancelled: 'Annulé',
      rescheduled: 'Reporté',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.scheduled}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">
            Erreur lors du chargement des entretiens
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              📅 Gestion des entretiens
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalInterviews} entretien{totalInterviews > 1 ? "s" : ""} planifié{totalInterviews > 1 ? "s" : ""}
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <span>➕</span>
            <span>Nouvel entretien</span>
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par candidat, titre..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les statuts</option>
                <option value="scheduled">Planifié</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
                <option value="rescheduled">Reporté</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {interviews.length}
                </div>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Planifiés</div>
                <div className="text-2xl font-bold text-blue-600">
                  {interviews.filter(i => i.status === 'scheduled').length}
                </div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Terminés</div>
                <div className="text-2xl font-bold text-green-600">
                  {interviews.filter(i => i.status === 'completed').length}
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cette semaine</div>
                <div className="text-2xl font-bold text-purple-600">
                  {interviews.filter(i => {
                    const interviewDate = new Date(i.scheduled_date);
                    const now = new Date();
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return interviewDate >= weekStart && interviewDate <= weekEnd;
                  }).length}
                </div>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <span className="text-xl">📆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des entretiens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          {interviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Candidat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Titre / Poste
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {interviews.map((interview) => {
                    const candidateName = interview.application?.cv
                      ? `${interview.application.cv.candidate_first_name || ""} ${interview.application.cv.candidate_last_name || ""}`.trim()
                      : "Candidat";
                    
                    return (
                      <tr
                        key={interview.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleViewInterview(interview)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {candidateName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {interview.application?.cv?.candidate_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {interview.title || interview.application?.request?.title || 'Entretien'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {interview.application?.request?.reference}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(interview.scheduled_date)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(interview.scheduled_date)} ({interview.duration_minutes}min)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <span className="mr-2">
                              {interview.type === 'online' ? '🌐' : '📍'}
                            </span>
                            {interview.type === 'online' ? 'En ligne' : 'Présentiel'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(interview.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInterview(interview);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              <div className="flex flex-col items-center gap-4">
                <span className="text-4xl">📅</span>
                <div>
                  <p className="text-lg font-medium">Aucun entretien planifié</p>
                  <p className="text-sm mt-1">Commencez par créer votre premier entretien</p>
                </div>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2"
                >
                  Créer un entretien
                </Button>
              </div>
            </div>
          )}

          {/* Pagination - Always visible */}
          {data && data.pagination && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                totalItems={data.pagination.total}
                itemsPerPage={data.pagination.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de création d'entretien simplifié */}
      <CreateInterviewSimpleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateInterview}
        application={undefined}
        isLoading={isCreating}
      />

      {/* Modal de détails d'entretien */}
      {selectedInterview && (
        <InterviewDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInterview(null);
          }}
          interview={selectedInterview}
        />
      )}
    </>
  );
}
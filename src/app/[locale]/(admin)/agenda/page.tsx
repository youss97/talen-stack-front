"use client";
import { useState, useCallback, useMemo, type ComponentType } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslations, useLocale } from "next-intl";
import { useGetInterviewsByDateRangeQuery, useChangeInterviewStatusMutation, useDeleteInterviewMutation, useRescheduleInterviewMutation } from "@/lib/services/interviewApi";
import { useGetIntegrationsByDateRangeQuery } from "@/lib/services/integrationApi";
import InterviewDetailModal from "@/components/interviews/InterviewDetailModal";
import IntegrationAgendaModal from "@/components/integrations/IntegrationAgendaModal";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { ToastContainer } from "@/components/ui/toast/Toast";
import { useToast } from "@/hooks/useToast";
import { useAppSelector } from "@/lib/hooks";
import type { Interview } from "@/types/interview";

// Configuration de moment en français
moment.locale("fr");
const localizer = momentLocalizer(moment);
// react-big-calendar supports an `rtl` prop at runtime (see Calendar.js), but the
// installed @types definitions don't declare it — cast to bypass the stale typing.
const RtlCalendar = Calendar as unknown as ComponentType<Record<string, unknown>>;

export default function AgendaPage() {
  const t = useTranslations("agenda");
  const tc = useTranslations("common");
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  // Client company users have parent_company_id set — they get read-only access
  const isClientUser = !!user?.company?.parent_company_id;

  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; interviewId: string | null }>({
    isOpen: false,
    interviewId: null,
  });

  // États pour les filtres et la période
  const [filters, setFilters] = useState({
    showInterviews: true,
    showIntegrations: true,
    interviewStatus: 'all', // all, scheduled, completed, cancelled, rescheduled
    integrationStatus: 'all', // all, in_progress, completed, failed
  });

  // Calculer la période visible selon la vue du calendrier
  const dateRange = useMemo(() => {
    const start = new Date(date);
    const end = new Date(date);

    switch (view) {
      case 'month':
        // Pour la vue mois, prendre tout le mois + quelques jours avant/après pour les événements partiels
        start.setDate(1);
        start.setDate(start.getDate() - 7); // 1 semaine avant
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // Dernier jour du mois
        end.setDate(end.getDate() + 7); // 1 semaine après
        break;
      case 'week':
        // Pour la vue semaine, prendre la semaine complète (dimanche à samedi)
        const dayOfWeek = start.getDay(); // 0 = dimanche, 1 = lundi, etc.
        start.setDate(start.getDate() - dayOfWeek); // Aller au dimanche de cette semaine
        end.setDate(start.getDate() + 6); // Samedi de cette semaine
        break;
      case 'day':
        // Pour la vue jour, prendre juste ce jour
        // start reste le jour sélectionné, end aussi
        end.setHours(23, 59, 59, 999); // Fin de journée
        break;
      case 'agenda':
        // Pour l'agenda, prendre 3 mois
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() + 2);
        break;
      default:
        // Par défaut, prendre le mois
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
    }

    return {
      start: start.toISOString().split('T')[0], // Format YYYY-MM-DD
      end: end.toISOString().split('T')[0]
    };
  }, [date, view]);
  
  const { toasts, removeToast, success, error } = useToast();
  
  // Utiliser les nouveaux endpoints optimisés par période
  const { data: interviews = [], isLoading: interviewsLoading, error: interviewsError } = useGetInterviewsByDateRangeQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    status: filters.interviewStatus
  });
  
  const { data: integrations = [], isLoading: integrationsLoading, error: integrationsError } = useGetIntegrationsByDateRangeQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    status: filters.integrationStatus !== 'all' ? filters.integrationStatus as any : undefined
  });
  
  const [changeStatus] = useChangeInterviewStatusMutation();
  const [deleteInterview, { isLoading: isDeleting }] = useDeleteInterviewMutation();
  const [rescheduleInterview] = useRescheduleInterviewMutation();

  const isLoading = interviewsLoading || integrationsLoading;
  const loadError = interviewsError || integrationsError;

  // Convertir les entretiens en événements (filtrage côté serveur)
  const interviewEvents = useMemo(() => {
    if (!filters.showInterviews) return [];
    
    return interviews.map((interview) => {
      const start = new Date(interview.scheduled_date);
      const end = new Date(start.getTime() + interview.duration_minutes * 60000);
      
      const candidateName = interview.application?.cv
        ? `${interview.application.cv.candidate_first_name || ""} ${interview.application.cv.candidate_last_name || ""}`.trim()
        : t("events.candidateFallback");

      const title = interview.title || t("events.interviewTitle", { candidateName });

      return {
        id: interview.id,
        title: title,
        start: start,
        end: end,
        resource: interview,
        type: 'interview'
      };
    });
  }, [interviews, filters.showInterviews]);

  // Convertir les intégrations en événements (filtrage côté serveur)
  const integrationEvents = useMemo(() => {
    if (!filters.showIntegrations) return [];
    
    return integrations.map((integration) => {
      const start = new Date(integration.integration_date);
      const end = new Date(start.getTime() + 8 * 60 * 60 * 1000); // 8 heures de travail par défaut
      
      const candidateName = integration.application?.cv
        ? `${integration.application.cv.candidate_first_name || ""} ${integration.application.cv.candidate_last_name || ""}`.trim()
        : t("events.candidateFallback");

      const title = t("events.integrationTitle", { candidateName, position: integration.position });

      return {
        id: integration.id,
        title: title,
        start: start,
        end: end,
        resource: integration,
        type: 'integration'
      };
    });
  }, [integrations, filters.showIntegrations]);

  // Combiner tous les événements
  const events = [...interviewEvents, ...integrationEvents];

  // Statistiques pour les cartes
  const stats = useMemo(() => {
    const interviewStats = {
      total: interviews.length,
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      completed: interviews.filter(i => i.status === 'completed').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
      rescheduled: interviews.filter(i => i.status === 'rescheduled').length,
    };

    const integrationStats = {
      total: integrations.length,
      in_progress: integrations.filter(i => i.status === 'in_progress').length,
      completed: integrations.filter(i => i.status === 'completed').length,
      failed: integrations.filter(i => i.status === 'failed').length,
    };

    return { interviews: interviewStats, integrations: integrationStats };
  }, [interviews, integrations]);

  const handleSelectEvent = useCallback((event: any) => {
    if (event.type === 'integration') {
      // Ouvrir le modal d'intégration
      setSelectedIntegrationId(event.resource.id);
      setIsIntegrationModalOpen(true);
      return;
    }
    
    // Pour les entretiens
    setSelectedInterview(event.resource);
    setIsDetailModalOpen(true);
  }, []);

  const handleChangeStatus = async (interviewId: string, newStatus: string) => {
    try {
      await changeStatus({ id: interviewId, status: newStatus }).unwrap();
      success(t("toasts.statusChanged.title"), t("toasts.statusChanged.message"));
    } catch (err) {
      console.error("Erreur:", err);
      error(t("toasts.statusChangeError.title"), t("toasts.statusChangeError.message"));
    }
  };

  const handleReschedule = async (interviewId: string, newDate: Date, newDuration?: number) => {
    try {
      await rescheduleInterview({ 
        id: interviewId, 
        scheduled_date: newDate.toISOString(),
        duration_minutes: newDuration 
      }).unwrap();
      success(t("toasts.rescheduled.title"), t("toasts.rescheduled.message"));
    } catch (err) {
      console.error("Erreur:", err);
      error(t("toasts.rescheduleError.title"), t("toasts.rescheduleError.message"));
    }
  };

  const handleDeleteClick = (interviewId: string) => {
    setConfirmDelete({ isOpen: true, interviewId });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.interviewId) return;
    
    try {
      await deleteInterview(confirmDelete.interviewId).unwrap();
      success(t("toasts.deleted.title"), t("toasts.deleted.message"));
      setConfirmDelete({ isOpen: false, interviewId: null });
    } catch (err) {
      console.error("Erreur:", err);
      error(t("toasts.deleteError.title"), t("toasts.deleteError.message"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t("loading.message")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {t("loading.range", { start: dateRange.start, end: dateRange.end })}
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">
            {t("loadError.title")}
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {(loadError as any)?.data?.message || (loadError as any)?.message || t("loadError.unknown")}
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t("page.title")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("page.eventsDisplayed", { count: events.length })}
              </p>
            </div>
          </div>

          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Carte Entretiens */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("cards.interviews.title")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("cards.interviews.subtitle")}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.interviews.total}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.interviews.scheduled")}</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {stats.interviews.scheduled}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.interviews.completed")}</span>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.interviews.completed}
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.interviews.rescheduled")}</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                    {stats.interviews.rescheduled}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.interviews.cancelled")}</span>
                  </div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                    {stats.interviews.cancelled}
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Intégrations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("cards.integrations.title")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("cards.integrations.subtitle")}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.integrations.total}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.integrations.inProgress")}</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {stats.integrations.in_progress}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.integrations.completed")}</span>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.integrations.completed}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("cards.integrations.failed")}</span>
                  </div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                    {stats.integrations.failed}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("filters.label")}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Affichage */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.showInterviews}
                      onChange={(e) => setFilters(prev => ({ ...prev, showInterviews: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t("filters.interviews")}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.showIntegrations}
                      onChange={(e) => setFilters(prev => ({ ...prev, showIntegrations: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t("filters.integrations")}</span>
                  </label>
                </div>

                {/* Statut entretiens */}
                {filters.showInterviews && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">{t("filters.interviewStatus")}</label>
                    <select
                      value={filters.interviewStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, interviewStatus: e.target.value }))}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">{t("filters.options.all")}</option>
                      <option value="scheduled">{t("filters.options.scheduled")}</option>
                      <option value="completed">{t("filters.options.completed")}</option>
                      <option value="cancelled">{t("filters.options.cancelled")}</option>
                      <option value="rescheduled">{t("filters.options.rescheduled")}</option>
                    </select>
                  </div>
                )}

                {/* Statut intégrations */}
                {filters.showIntegrations && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">{t("filters.integrationStatus")}</label>
                    <select
                      value={filters.integrationStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, integrationStatus: e.target.value }))}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="all">{t("filters.options.all")}</option>
                      <option value="in_progress">{t("filters.options.inProgress")}</option>
                      <option value="completed">{t("filters.options.integrationCompleted")}</option>
                      <option value="failed">{t("filters.options.failed")}</option>
                    </select>
                  </div>
                )}

                {/* Bouton reset */}
                <button
                  onClick={() => setFilters({
                    showInterviews: true,
                    showIntegrations: true,
                    interviewStatus: 'all',
                    integrationStatus: 'all',
                  })}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t("filters.reset")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-4 md:p-6" 
             style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
          <RtlCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%", minHeight: "450px" }}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "week", "day", "agenda"]}
            defaultView="month"
            popup={true}
            selectable={true}
            step={30}
            timeslots={2}
            rtl={locale === 'ar'}
            scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
            messages={{
              allDay: t("calendar.allDay"),
              previous: t("calendar.previous"),
              next: t("calendar.next"),
              today: t("calendar.today"),
              month: t("calendar.month"),
              week: t("calendar.week"),
              day: t("calendar.day"),
              agenda: t("calendar.agenda"),
              date: t("calendar.date"),
              time: t("calendar.time"),
              event: t("calendar.event"),
              noEventsInRange: t("calendar.noEventsInRange"),
              showMore: (total: number) => t("calendar.showMore", { total }),
            }}
            eventPropGetter={(event: any) => {
              let backgroundColor = "#3b82f6";
              
              if (event.type === 'integration') {
                // Couleurs pour les intégrations selon le statut
                const integration = event.resource;
                switch (integration.status) {
                  case "in_progress":
                    backgroundColor = "#8b5cf6"; // Violet
                    break;
                  case "completed":
                    backgroundColor = "#10b981"; // Vert
                    break;
                  case "failed":
                    backgroundColor = "#ef4444"; // Rouge
                    break;
                  default:
                    backgroundColor = "#8b5cf6"; // Violet par défaut
                }
              } else {
                // Couleurs pour les entretiens selon le statut
                const interview = event.resource;
                switch (interview.status) {
                  case "scheduled":
                    backgroundColor = "#3b82f6"; // Bleu
                    break;
                  case "completed":
                    backgroundColor = "#10b981"; // Vert
                    break;
                  case "cancelled":
                    backgroundColor = "#ef4444"; // Rouge
                    break;
                  case "rescheduled":
                    backgroundColor = "#f59e0b"; // Orange
                    break;
                }
              }

              return {
                style: {
                  backgroundColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                  minHeight: '20px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              };
            }}
            formats={{
              timeGutterFormat: "HH:mm",
              eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: any, localizer: any) =>
                `${localizer?.format(start, "HH:mm", culture)} - ${localizer?.format(end, "HH:mm", culture)}`,
              agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: any, localizer: any) =>
                `${localizer?.format(start, "HH:mm", culture)} - ${localizer?.format(end, "HH:mm", culture)}`,
              agendaDateFormat: (date: Date, culture: any, localizer: any) =>
                localizer?.format(date, "dddd DD MMMM YYYY", culture) || "",
              dayHeaderFormat: (date: Date, culture: any, localizer: any) =>
                localizer?.format(date, "dddd DD MMMM", culture) || "",
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }, culture: any, localizer: any) =>
                `${localizer?.format(start, "DD MMMM", culture)} - ${localizer?.format(end, "DD MMMM YYYY", culture)}`,
              monthHeaderFormat: (date: Date, culture: any, localizer: any) =>
                localizer?.format(date, "MMMM YYYY", culture) || "",
              dayFormat: (date: Date, culture: any, localizer: any) =>
                localizer?.format(date, "DD", culture) || "",
              weekdayFormat: (date: Date, culture: any, localizer: any) =>
                localizer?.format(date, "ddd", culture) || "",
            }}
            min={new Date(1970, 1, 1, 7, 0, 0)}
            max={new Date(1970, 1, 1, 22, 0, 0)}
            dayLayoutAlgorithm="no-overlap"
          />
        </div>

        {/* Légende des couleurs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("legend.title")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entretiens */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                {t("legend.interviews.title")}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.interviews.scheduled")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.interviews.completed")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.interviews.rescheduled")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.interviews.cancelled")}</span>
                </div>
              </div>
            </div>

            {/* Intégrations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <span className="text-lg">🔗</span>
                {t("legend.integrations.title")}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.integrations.inProgress")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.integrations.completed")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{t("legend.integrations.failed")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails avec actions */}
      {selectedInterview && (
        <InterviewDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInterview(null);
          }}
          interview={selectedInterview}
          onChangeStatus={isClientUser ? undefined : handleChangeStatus}
          onReschedule={isClientUser ? undefined : handleReschedule}
          onDelete={isClientUser ? undefined : handleDeleteClick}
        />
      )}

      {/* Modal de détails d'intégration */}
      {selectedIntegrationId && (
        <IntegrationAgendaModal
          integrationId={selectedIntegrationId}
          isOpen={isIntegrationModalOpen}
          onClose={() => {
            setIsIntegrationModalOpen(false);
            setSelectedIntegrationId(null);
          }}
          onSuccess={() => {
            success(t("toasts.integrationUpdated.title"), t("toasts.integrationUpdated.message"));
          }}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, interviewId: null })}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        message={t("deleteModal.message")}
        confirmText={t("deleteModal.confirmText")}
        cancelText={tc("actions.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
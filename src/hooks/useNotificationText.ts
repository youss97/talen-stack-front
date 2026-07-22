import { useTranslations } from "next-intl";
import type { AppNotification } from "@/lib/services/notificationApi";

const NO_LABEL = "__NONE__";

function hasValue(v: unknown): v is string {
  return typeof v === "string" && v !== "" && v !== NO_LABEL;
}

/**
 * Traduit une notification (title + message) selon la langue active, à partir de son
 * event_key + params. Repli sur title/message bruts pour les notifications historiques
 * (créées avant l'introduction de event_key, donc sans ce champ).
 */
export function useNotificationText() {
  const t = useTranslations("notifications.messages");
  const tStatus = useTranslations("notifications.statusLabels");

  return (n: AppNotification): { title: string; message: string } => {
    if (!n.event_key) {
      return { title: n.title || "", message: n.message || "" };
    }

    const p = (n.params || {}) as Record<string, unknown>;
    const label = hasValue(p.label) ? p.label : null;

    try {
      switch (n.event_key) {
        case "recruitment_request.created_by_rh":
        case "recruitment_request.created_by_client":
          return {
            title: t(`${n.event_key}.title`),
            message: t(`${n.event_key}.message`, { requestTitle: String(p.requestTitle ?? "") }),
          };

        case "recruitment_request.status_changed_by_client": {
          const newStatus = tStatus.has(String(p.newStatus))
            ? tStatus(String(p.newStatus))
            : String(p.newStatus ?? "");
          return {
            title: t(`${n.event_key}.title`),
            message: t(`${n.event_key}.message`, { requestTitle: String(p.requestTitle ?? ""), newStatus }),
          };
        }

        case "application.proposed":
          return label
            ? {
                title: t("application.proposed.titleWithLabel", { label }),
                message: t("application.proposed.messageWithLabel", { label }),
              }
            : {
                title: t("application.proposed.titleNoLabel"),
                message: t("application.proposed.messageNoLabel"),
              };

        case "application.status_changed": {
          const change = String(p.change ?? "");
          return label
            ? {
                title: t("application.status_changed.titleWithLabel", { label }),
                message: t("application.status_changed.messageWithLabel", { label, change }),
              }
            : {
                title: t("application.status_changed.titleNoLabel"),
                message: t("application.status_changed.messageNoLabel", { change }),
              };
        }

        case "application.status_transitioned": {
          const oldStatus = String(p.oldStatus ?? "");
          const newStatus = String(p.newStatus ?? "");
          return label
            ? {
                title: t("application.status_transitioned.titleWithLabel", { label }),
                message: t("application.status_transitioned.messageWithLabel", { label, oldStatus, newStatus }),
              }
            : {
                title: t("application.status_transitioned.titleNoLabel"),
                message: t("application.status_transitioned.messageNoLabel", { oldStatus, newStatus }),
              };
        }

        case "feedback.created": {
          const candidateName = hasValue(p.candidateName) ? p.candidateName : null;
          const offerTitle = hasValue(p.offerTitle) ? p.offerTitle : null;
          const feedbackTitle = String(p.feedbackTitle ?? "");
          const title = candidateName
            ? t("feedback.created.titleWithCandidate", { candidateName })
            : t("feedback.created.titleNoCandidate");
          const messageKey = candidateName
            ? offerTitle
              ? "feedback.created.messageCandidateOffer"
              : "feedback.created.messageCandidateNoOffer"
            : offerTitle
              ? "feedback.created.messageNoCandidateOffer"
              : "feedback.created.messageNoCandidateNoOffer";
          return {
            title,
            message: t(messageKey, {
              ...(candidateName ? { candidateName } : {}),
              ...(offerTitle ? { offerTitle } : {}),
              feedbackTitle,
            }),
          };
        }

        case "public_application.created":
          return {
            title: t("public_application.created.title"),
            message: t("public_application.created.message", {
              firstName: String(p.firstName ?? ""),
              lastName: String(p.lastName ?? ""),
              offerTitle: String(p.offerTitle ?? ""),
            }),
          };

        case "interview.scheduled": {
          const scheduledDate = p.scheduledDate ? new Date(String(p.scheduledDate)).toLocaleString() : "";
          return label
            ? {
                title: t("interview.scheduled.titleWithLabel", { label }),
                message: t("interview.scheduled.messageWithLabel", { label, scheduledDate }),
              }
            : {
                title: t("interview.scheduled.titleNoLabel"),
                message: t("interview.scheduled.messageNoLabel", { scheduledDate }),
              };
        }

        case "interview.cancelled": {
          const reason = String(p.reason ?? "");
          return label
            ? {
                title: t("interview.cancelled.titleWithLabel", { label }),
                message: t("interview.cancelled.messageWithLabel", { label, reason }),
              }
            : {
                title: t("interview.cancelled.titleNoLabel"),
                message: t("interview.cancelled.messageNoLabel", { reason }),
              };
        }

        default:
          return { title: n.title || "", message: n.message || "" };
      }
    } catch {
      // Clé de traduction manquante ou params invalides : repli sur le texte brut
      return { title: n.title || "", message: n.message || "" };
    }
  };
}

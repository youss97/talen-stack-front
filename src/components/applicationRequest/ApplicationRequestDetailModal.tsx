"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { ApplicationRequest } from "@/types/applicationRequest";

interface ApplicationRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationRequest: ApplicationRequest | null;
  isLoading?: boolean;
  onStatusUpdate?: (requestId: string, newStatus: string) => Promise<void>;
}

export default function ApplicationRequestDetailModal({
  isOpen,
  onClose,
  applicationRequest,
  isLoading = false,
  onStatusUpdate,
}: ApplicationRequestDetailModalProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!applicationRequest && !isLoading) return null;

  const handleStartEditStatus = () => {
    setSelectedStatus(applicationRequest?.status || "in_progress");
    setIsEditingStatus(true);
  };

  const handleCancelEditStatus = () => {
    setIsEditingStatus(false);
    setSelectedStatus("");
  };

  const handleSaveStatus = async () => {
    if (!applicationRequest || !onStatusUpdate) return;
    
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(applicationRequest.id, selectedStatus);
      setIsEditingStatus(false);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "En cours";
      case "standby":
        return "Standby";
      case "abandoned":
        return "Abandonnée";
      case "filled":
        return "Comblée";
      case "open":
        return "Ouverte";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "info";
      case "standby":
        return "warning";
      case "abandoned":
        return "error";
      case "filled":
        return "success";
      case "open":
        return "success";
      default:
        return "light";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "success";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "Critique";
      case "high":
        return "Haute";
      case "medium":
        return "Moyenne";
      default:
        return "Basse";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Détails de la demande
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Informations complètes de la demande de recrutement
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : applicationRequest ? (
          <div className="space-y-6">
            {/* En-tête avec titre et urgence */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {applicationRequest.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Réf: {applicationRequest.reference}
                </p>
              </div>
              <Badge
                variant="light"
                color={getUrgencyColor(applicationRequest.urgency || '')}
              >
                {getUrgencyLabel(applicationRequest.urgency || '')}
              </Badge>
            </div>

            {/* Informations du client */}
            {applicationRequest.client && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Client
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nom</p>
                      <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.client.name || "-"}</p>
                    </div>
                    {applicationRequest.client.contact_email && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.client.contact_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Informations du manager */}
            {applicationRequest.manager && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Manager
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nom</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {`${applicationRequest.manager.first_name || ""} ${applicationRequest.manager.last_name || ""}`.trim() || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.manager.email || "-"}</p>
                    </div>
                  </div>
                  {applicationRequest.manager.role && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Rôle</p>
                      <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.manager.role.name || "-"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Description
              </h4>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {applicationRequest.description}
              </p>
            </div>

            {/* Compétences requises */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Compétences requises
              </h4>
              <div className="flex flex-wrap gap-2">
                {applicationRequest.required_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Informations du poste */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Informations du poste
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type de contrat
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.contract_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expérience minimum
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.min_experience} ans
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Salaire minimum
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.min_salary?.toLocaleString("fr-FR") ?? '-'} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date de début
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.desired_start_date 
                      ? new Date(applicationRequest.desired_start_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Statut de la demande */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Statut de la demande
              </h4>
              {!isEditingStatus ? (
                <div className="flex items-center gap-3">
                  <Badge
                    variant="light"
                    color={getStatusColor(applicationRequest.status) as "success" | "error" | "warning" | "info" | "light"}
                  >
                    {getStatusLabel(applicationRequest.status)}
                  </Badge>
                  {onStatusUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEditStatus}
                    >
                      Modifier le statut
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
                    disabled={isUpdatingStatus}
                  >
                    <option value="in_progress">En cours</option>
                    <option value="standby">Standby</option>
                    <option value="abandoned">Abandonnée</option>
                    <option value="filled">Comblée</option>
                    <option value="open">Ouverte</option>
                  </select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveStatus}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditStatus}
                      disabled={isUpdatingStatus}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Dates */}
            {(applicationRequest.created_at || applicationRequest.updated_at) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Historique
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {applicationRequest.created_at && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Créé le
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(applicationRequest.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                  {applicationRequest.updated_at && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Modifié le
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(applicationRequest.updated_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}

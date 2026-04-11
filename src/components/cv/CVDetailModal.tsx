"use client";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { CV } from "@/types/cv";

interface CVDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cv: CV | null;
  isLoading?: boolean;
}

export default function CVDetailModal({
  isOpen,
  onClose,
  cv,
  isLoading = false,
}: CVDetailModalProps) {
  if (!cv && !isLoading) return null;

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "new":
        return "Nouveau";
      case "reviewed":
        return "Examiné";
      case "shortlisted":
        return "Présélectionné";
      case "interviewed":
        return "Interviewé";
      case "hired":
        return "Embauché";
      case "rejected":
        return "Rejeté";
      case "archived":
        return "Archivé";
      default:
        return status || "-";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "new":
        return "info";
      case "reviewed":
        return "warning";
      case "shortlisted":
        return "info";
      case "interviewed":
        return "warning";
      case "hired":
        return "success";
      case "rejected":
        return "error";
      case "archived":
        return "light";
      default:
        return "light";
    }
  };

  const fullName = cv ? [cv.candidate_first_name, cv.candidate_last_name]
    .filter(Boolean)
    .join(" ") || "Candidat" : "Détails du CV";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {fullName}
          </h2>
          {cv?.last_position && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {cv.last_position}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : cv ? (
          <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Email" value={cv.candidate_email || "-"} />
          <DetailItem label="Téléphone" value={cv.candidate_phone || "-"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Expérience" value={cv.total_experience ? `${cv.total_experience} ans` : "-"} />
          <DetailItem label="Formation" value={cv.last_education || "-"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Secteur" value={cv.industry_experience || "-"} />
          <DetailItem label="Télétravail" value={cv.remote_preferred ? "Oui" : "Non"} />
        </div>

        {cv.additional_skills && cv.additional_skills.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Compétences
            </h3>
            <div className="flex flex-wrap gap-2">
              {cv.additional_skills.map((skill, index) => (
                <Badge key={index} color="light" variant="solid" size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {cv.geographic_mobility && cv.geographic_mobility.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Mobilité géographique
            </h3>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {cv.geographic_mobility.join(", ")}
            </p>
          </div>
        )}

        {cv.contract_type_preferences && cv.contract_type_preferences.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Types de contrat préférés
            </h3>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {cv.contract_type_preferences.join(", ")}
            </p>
          </div>
        )}

        {cv.file_path && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document CV
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {cv.file_name || "CV.pdf"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                  window.open(`${apiUrl}/${cv.file_path}`, '_blank');
                }}
              >
                Ouvrir le CV
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Statut
          </h3>
          <Badge
            color={getStatusColor(cv.status) as "success" | "error" | "warning" | "info" | "light"}
            variant="light"
          >
            {getStatusLabel(cv.status)}
          </Badge>
        </div>
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}

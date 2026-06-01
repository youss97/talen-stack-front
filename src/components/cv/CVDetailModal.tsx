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

  // Fallbacks: findOne returns raw entity without cv.details, findAll builds it.
  // Use cv.experiences / cv.formations / cv.skills / cv.full_information as fallback.
  const fullInfoExtraction = (cv?.full_information as any)?.extraction || {};
  const fullInfoUserData = (cv?.full_information as any)?.user_provided_data || {};
  const effectiveExperiences: any[] = cv?.details?.experiences?.length
    ? cv.details.experiences
    : (cv?.experiences as any[]) || [];
  const effectiveFormations: any[] = cv?.details?.formations?.length
    ? cv.details.formations
    : (cv?.formations as any[]) || [];
  const effectiveSummary = cv?.details?.summary || fullInfoExtraction.summary || null;
  const effectiveTechnicalSkills: string[] = cv?.details?.technical_skills?.length
    ? cv.details.technical_skills
    : (cv?.skills as string[]) || [];
  const effectiveSoftSkills: string[] = cv?.details?.soft_skills || [];
  const effectiveCertifications: string[] = cv?.details?.certifications?.length
    ? cv.details.certifications
    : fullInfoExtraction.certifications || [];
  const effectiveNotes = cv?.details?.notes || fullInfoUserData.notes || null;
  const effectiveLanguages: Array<{ language: string; level: string }> =
    cv?.details?.languages_detailed?.length
      ? cv.details.languages_detailed
      : (cv?.languages as string[] || []).map((lang: string) => {
          const match = lang.match(/^(.+?)\s*\((.+?)\)$/);
          if (match) return { language: match[1].trim(), level: match[2].trim() };
          return { language: lang, level: 'Non spécifié' };
        });

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
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Email" value={cv.candidate_email || "-"} />
              <DetailItem label="Téléphone" value={cv.candidate_phone || "-"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Expérience" value={cv.total_experience ? `${cv.total_experience} ans` : "-"} />
              <DetailItem label="Formation" value={cv.last_education || "-"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {cv.specialty && <DetailItem label="Spécialité pertinente" value={cv.specialty} />}
              <DetailItem label="Secteur" value={cv.industry_experience || "-"} />
              <DetailItem label="Télétravail" value={cv.remote_preferred ? "Oui" : "Non"} />
            </div>

            {/* Score de complétude */}
            {cv.details?.stats?.completeness_score && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Complétude du profil
                </h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-green-500 flex items-center justify-center text-xs font-semibold text-white transition-all duration-300"
                    style={{ width: `${cv.details.stats.completeness_score}%` }}
                  >
                    {cv.details.stats.completeness_score}%
                  </div>
                </div>
              </div>
            )}

            {/* Résumé professionnel */}
            {effectiveSummary && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📝 Résumé professionnel
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {effectiveSummary}
                </p>
              </div>
            )}

            {/* Expériences professionnelles */}
            {effectiveExperiences.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  💼 Expériences professionnelles ({cv.details?.stats?.total_experiences || effectiveExperiences.length})
                </h3>
                <div className="space-y-4">
                  {effectiveExperiences.map((exp: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-brand-500">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {exp.title || "Poste non spécifié"}
                        </h4>
                        {exp.duration && (
                          <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-full">
                            {exp.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>{exp.company || "Entreprise non spécifiée"}</strong>
                        {exp.location && ` · ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formations */}
            {effectiveFormations.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🎓 Formations ({cv.details?.stats?.total_formations || effectiveFormations.length})
                </h3>
                <div className="space-y-3">
                  {effectiveFormations.map((form: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-green-500">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {form.degree || "Diplôme non spécifié"}
                      </h4>
                      {form.field && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {form.field}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {form.institution || "Institution non spécifiée"}
                      </p>
                      {(form.start_date || form.end_date) && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {form.start_date} {form.end_date && `- ${form.end_date}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compétences techniques */}
            {effectiveTechnicalSkills.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🛠️ Compétences techniques ({effectiveTechnicalSkills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {effectiveTechnicalSkills.map((skill: string, index: number) => (
                    <Badge key={index} color="info" variant="light" size="sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Compétences transversales */}
            {effectiveSoftSkills.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  💡 Compétences transversales ({effectiveSoftSkills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {effectiveSoftSkills.map((skill: string, index: number) => (
                    <Badge key={index} color="success" variant="light" size="sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Toutes les compétences (fallback si pas de détails) */}
            {effectiveTechnicalSkills.length === 0 && effectiveSoftSkills.length === 0 && cv.additional_skills && cv.additional_skills.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🛠️ Compétences ({cv.additional_skills.length})
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

            {/* Langues */}
            {effectiveLanguages.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🌍 Langues ({cv.details?.stats?.total_languages || effectiveLanguages.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {effectiveLanguages.map((lang: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {lang.language}
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {effectiveCertifications.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🏆 Certifications ({cv.details?.stats?.total_certifications || effectiveCertifications.length})
                </h3>
                <ul className="space-y-2">
                  {effectiveCertifications.map((cert: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                      <span className="text-yellow-500 mt-0.5">✓</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobilité géographique */}
            {cv.geographic_mobility && cv.geographic_mobility.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📍 Mobilité géographique
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {cv.geographic_mobility.join(", ")}
                </p>
              </div>
            )}

            {/* Types de contrat */}
            {cv.contract_type_preferences && cv.contract_type_preferences.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📄 Types de contrat préférés
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {cv.contract_type_preferences.join(", ")}
                </p>
              </div>
            )}

            {/* Notes */}
            {effectiveNotes && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📌 Notes
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
                  {effectiveNotes}
                </p>
              </div>
            )}

            {/* Document CV */}
            {cv.file_path && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📄 Document CV
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
                    onClick={async () => {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                      const token = typeof window !== 'undefined'
                        ? localStorage.getItem('token')
                        : null;
                      try {
                        const res = await fetch(`${apiUrl}/cvs/${cv.id}/download`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        if (!res.ok) throw new Error('Téléchargement échoué');
                        const blob = await res.blob();
                        const disposition = res.headers.get('Content-Disposition') || '';
                        const match = disposition.match(/filename="?([^"]+)"?/);
                        const filename = match?.[1] || 'CV.pdf';
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        // Fallback: open directly
                        if (cv.file_path) window.open(cv.file_path, '_blank');
                      }
                    }}
                  >
                    Télécharger le CV
                  </Button>
                </div>
              </div>
            )}

            {/* Statut */}
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

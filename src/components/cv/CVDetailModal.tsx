"use client";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { CV } from "@/types/cv";
import { openCvInNewTab, downloadCvFile } from "@/utils/cvView";

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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      {/* ── En-tête ── */}
      <div className="flex-shrink-0 p-5 sm:p-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start gap-4">
          {/* Avatar initiales */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-sm"
            style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}
          >
            {fullName.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-semibold leading-tight" style={{ color: "var(--text)" }}>{fullName}</h2>
              {cv && (
                <Badge color={getStatusColor(cv.status) as "success" | "error" | "warning" | "info" | "light"} variant="light" size="sm">
                  {getStatusLabel(cv.status)}
                </Badge>
              )}
            </div>
            {(cv?.profile_title || cv?.last_position) && (
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--brand-deep)" }}>
                {cv?.profile_title || cv?.last_position}
              </p>
            )}

            {/* Coordonnées / infos clés — aérées */}
            {cv && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {cv.candidate_email && <InfoChip icon="✉" text={cv.candidate_email} />}
                {cv.candidate_phone && <InfoChip icon="☎" text={cv.candidate_phone} />}
                {cv.total_experience ? <InfoChip icon="🎯" text={`${cv.total_experience} ans d'expérience`} /> : null}
                {cv.last_education && <InfoChip icon="🎓" text={cv.last_education} />}
                {cv.remote_preferred && <InfoChip icon="🏠" text="Télétravail" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 custom-scrollbar" style={{ background: "var(--surface-2)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : cv ? (
          <div className="space-y-4">
            {/* Infos complémentaires */}
            {(cv.specialty || cv.industry_experience || cv.remote_preferred != null || cv.source) && (
              <Section title="Informations" icon="ℹ️" accent="var(--brand)">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {cv.specialty && <DetailItem label="Spécialité" value={cv.specialty} />}
                  <DetailItem label="Secteur" value={cv.industry_experience || "-"} />
                  <DetailItem label="Télétravail" value={cv.remote_preferred ? "Oui" : "Non"} />
                  <DetailItem label="Source" value={cv.source || "-"} />
                </div>
              </Section>
            )}

            {/* Score de complétude */}
            {cv.details?.stats?.completeness_score && (
              <Section title="Complétude du profil" icon="📊" accent="var(--brand)">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-green-500 flex items-center justify-center text-xs font-semibold text-white transition-all duration-300"
                    style={{ width: `${cv.details.stats.completeness_score}%` }}
                  >
                    {cv.details.stats.completeness_score}%
                  </div>
                </div>
              </Section>
            )}

            {/* Résumé professionnel */}
            {effectiveSummary && (
              <Section title="Résumé professionnel" icon="📝" accent="var(--brand)">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  {effectiveSummary}
                </p>
              </Section>
            )}

            {/* Expériences professionnelles */}
            {effectiveExperiences.length > 0 && (
              <Section
                title={`Expériences professionnelles (${cv.details?.stats?.total_experiences || effectiveExperiences.length})`}
                icon="💼"
                accent="var(--brand)"
              >
                <div className="space-y-3">
                  {effectiveExperiences.map((exp: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-xl p-4 border-l-4"
                      style={{ background: "var(--surface)", borderLeftColor: "var(--brand)", boxShadow: "var(--ds-shadow-card)" }}
                    >
                      <div className="flex justify-between items-start gap-3 mb-1.5">
                        <h4 className="font-semibold" style={{ color: "var(--text)" }}>
                          {exp.title || "Poste non spécifié"}
                        </h4>
                        {exp.duration && (
                          <span className="shrink-0 text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}>
                            {exp.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-2)" }}>
                        <strong style={{ color: "var(--text)" }}>{exp.company || "Entreprise non spécifiée"}</strong>
                        {exp.location && ` · ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-2)" }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Formations */}
            {effectiveFormations.length > 0 && (
              <Section
                title={`Formations (${cv.details?.stats?.total_formations || effectiveFormations.length})`}
                icon="🎓"
                accent="var(--brand-strong)"
              >
                <div className="space-y-3">
                  {effectiveFormations.map((form: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-xl p-4 border-l-4"
                      style={{ background: "var(--surface)", borderLeftColor: "var(--brand-strong)", boxShadow: "var(--ds-shadow-card)" }}
                    >
                      <h4 className="font-semibold mb-0.5" style={{ color: "var(--text)" }}>
                        {form.degree || "Diplôme non spécifié"}
                      </h4>
                      {form.field && (
                        <p className="text-sm" style={{ color: "var(--text-2)" }}>{form.field}</p>
                      )}
                      <p className="text-sm" style={{ color: "var(--text-2)" }}>
                        {form.institution || "Institution non spécifiée"}
                      </p>
                      {(form.start_date || form.end_date) && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                          {form.start_date} {form.end_date && `- ${form.end_date}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Compétences techniques */}
            {effectiveTechnicalSkills.length > 0 && (
              <Section title={`Compétences techniques (${effectiveTechnicalSkills.length})`} icon="🛠️" accent="var(--blue)">
                <div className="flex flex-wrap gap-2">
                  {effectiveTechnicalSkills.map((skill: string, index: number) => (
                    <Badge key={index} color="info" variant="light" size="sm">{skill}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {/* Compétences transversales */}
            {effectiveSoftSkills.length > 0 && (
              <Section title={`Compétences transversales (${effectiveSoftSkills.length})`} icon="💡" accent="var(--brand-strong)">
                <div className="flex flex-wrap gap-2">
                  {effectiveSoftSkills.map((skill: string, index: number) => (
                    <Badge key={index} color="success" variant="light" size="sm">{skill}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {/* Toutes les compétences (fallback si pas de détails) */}
            {effectiveTechnicalSkills.length === 0 && effectiveSoftSkills.length === 0 && cv.additional_skills && cv.additional_skills.length > 0 && (
              <Section title={`Compétences (${cv.additional_skills.length})`} icon="🛠️" accent="var(--blue)">
                <div className="flex flex-wrap gap-2">
                  {cv.additional_skills.map((skill, index) => (
                    <Badge key={index} color="light" variant="solid" size="sm">{skill}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {/* Langues */}
            {effectiveLanguages.length > 0 && (
              <Section title={`Langues (${cv.details?.stats?.total_languages || effectiveLanguages.length})`} icon="🌍" accent="var(--brand-strong)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {effectiveLanguages.map((lang: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center rounded-xl px-4 py-2.5"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{lang.language}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}>
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Certifications */}
            {effectiveCertifications.length > 0 && (
              <Section title={`Certifications (${cv.details?.stats?.total_certifications || effectiveCertifications.length})`} icon="🏆" accent="var(--amber)">
                <ul className="space-y-2.5">
                  {effectiveCertifications.map((cert: string, index: number) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text)" }}>
                      <span className="mt-0.5" style={{ color: "var(--amber)" }}>✓</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Mobilité géographique */}
            {cv.geographic_mobility && cv.geographic_mobility.length > 0 && (
              <Section title="Mobilité géographique" icon="📍" accent="var(--brand)">
                <div className="flex flex-wrap gap-2">
                  {cv.geographic_mobility.map((loc, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      {loc}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Types de contrat */}
            {cv.contract_type_preferences && cv.contract_type_preferences.length > 0 && (
              <Section title="Types de contrat préférés" icon="📄" accent="var(--brand)">
                <div className="flex flex-wrap gap-2">
                  {cv.contract_type_preferences.map((ct, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      {ct}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Notes */}
            {effectiveNotes && (
              <Section title="Notes" icon="📌" accent="var(--amber)">
                <p
                  className="text-sm leading-relaxed rounded-lg p-3.5"
                  style={{ background: "var(--amber-soft, #FDF6EC)", borderLeft: "4px solid var(--amber)", color: "var(--text)" }}
                >
                  {effectiveNotes}
                </p>
              </Section>
            )}

            {/* Document CV */}
            {cv.file_path && (
              <Section title="Document CV" icon="📄" accent="var(--brand-deep)">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[120px] text-sm truncate" style={{ color: "var(--text)" }}>
                    {cv.file_name || "CV.pdf"}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => cv.id && openCvInNewTab(cv.id)}>
                    👁️ Visualiser
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => cv.id && downloadCvFile(cv.id, cv.file_name || "CV.pdf")}>
                    Télécharger le CV
                  </Button>
                </div>
              </Section>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-5 border-t" style={{ borderColor: "var(--border)" }}>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}

/** Carte de section : titre avec pastille icône colorée + contenu aéré. */
function Section({ title, icon, accent, children }: { title: React.ReactNode; icon: string; accent: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--ds-shadow-card)" }}
    >
      <h3 className="flex items-center gap-2.5 mb-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function InfoChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
    >
      <span aria-hidden style={{ opacity: 0.8 }}>{icon}</span>
      <span style={{ color: "var(--text)" }}>{text}</span>
    </span>
  );
}

"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  useGetManagerClientTalopsiaReportQuery,
  useGetTalopsiaReportQuery,
} from "@/lib/services/testSessionApi";
import type {
  TalopsiaAlignmentLabel,
  TalopsiaCandidateReport,
  TalopsiaClientReport,
  TalopsiaProfileDimension,
  TalopsiaRecruiterReport,
  TalopsiaReport,
  TalopsiaReportDimensionLevel,
  TalopsiaReportVariant,
} from "@/types/testSession";

type Props =
  | { variant: TalopsiaReportVariant; sessionId: string; applicationId?: never }
  /** Portail client : rapport client de la candidature (route manager), rien n'est affiché si aucune évaluation */
  | { variant: "client"; applicationId: string; sessionId?: never };

/** Patterns de tension : leur description i18n parle « d'entretien » → non montrée au candidat. */
const TENSION_PATTERNS = new Set(["P09", "P10", "P11", "P12", "P13", "P14", "P22", "P25"]);

const ALIGNMENT_KEYS: Record<TalopsiaAlignmentLabel, string> = {
  "Très aligné": "veryAligned",
  "Aligné": "aligned",
  "Partiellement aligné": "partial",
  "À examiner": "toExamine",
};
const ALIGNMENT_CLASSES: Record<TalopsiaAlignmentLabel, string> = {
  "Très aligné": "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  "Aligné": "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  "Partiellement aligné": "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  "À examiner": "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
};

/**
 * Rapport TALOPSIA, décliné en 3 variantes (spec §16) — un seul composant, sections affichées selon
 * `variant`, sur le modèle de la séparation cabinet / client déjà en place (RecruiterDetailModal vs
 * CandidateApplicationDetailModal : le client ne reçoit jamais les champs internes).
 *
 *  - recruiter : 15 dimensions + 60 facettes, patterns, alignement complet, guide d'entretien,
 *                réponses brutes, métadonnées internes.
 *  - candidate : niveaux des 15 dimensions, 3 patterns, points d'attention formulés positivement.
 *  - client    : synthèse, points forts, points à explorer, alignement qualitatif, sujets d'entretien.
 *
 * Le filtrage des données est fait CÔTÉ SERVEUR (un endpoint par variante) : ce composant ne
 * masque rien qu'il aurait reçu — il ne reçoit que ce que la variante autorise.
 *
 * Règles de présentation : un niveau est une INTENSITÉ déclarée, jamais une note ; aucun libellé
 * « excellent » / « bon candidat » ; les patterns sont des tendances à explorer, pas des types
 * psychologiques validés ; l'alignement est qualitatif, jamais un pourcentage.
 */
export default function TalopsiaProfileView(props: Props) {
  const t = useTranslations("tests.talopsia");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showResponses, setShowResponses] = useState(false);

  const bySession = useGetTalopsiaReportQuery(
    { id: props.sessionId ?? "", variant: props.variant },
    { skip: !props.sessionId },
  );
  const byApplication = useGetManagerClientTalopsiaReportQuery(props.applicationId ?? "", { skip: !props.applicationId });

  const isPortal = !!props.applicationId;
  const isLoading = isPortal ? byApplication.isLoading : bySession.isLoading;
  const isError = isPortal ? byApplication.isError : bySession.isError;
  const report: TalopsiaReport | undefined = isPortal
    ? byApplication.data?.available
      ? byApplication.data.report
      : undefined
    : bySession.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }
  // Portail client : pas d'évaluation complétée (ou pas d'accès) → section simplement absente.
  if (isPortal && !report) return null;
  if (isError || !report) {
    return <p className="text-sm text-error-500 text-center py-6">{t("report.error")}</p>;
  }

  const label = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const levelLabel = (level: number | null) => (level ? t(`levels.${level}`) : t("report.notAvailable"));
  const patternLabel = (code: string, fallback: string) => label(`patterns.${code}.label`, fallback);
  const alignmentLabel = (a: TalopsiaAlignmentLabel) => t(`report.alignment.labels.${ALIGNMENT_KEYS[a]}`);

  const recruiter = report.variant === "recruiter" ? (report as TalopsiaRecruiterReport) : null;
  const candidate = report.variant === "candidate" ? (report as TalopsiaCandidateReport) : null;
  const client = report.variant === "client" ? (report as TalopsiaClientReport) : null;

  // Dimensions : avec facettes pour le recruteur, niveaux seuls pour candidat / client.
  type AnyDimension = TalopsiaProfileDimension | TalopsiaReportDimensionLevel;
  const dimensions: AnyDimension[] = report.dimensions;
  const groups = (["personality", "professional_behavior"] as const).map((category) => ({
    category,
    dimensions: dimensions.filter((d) => d.category === category),
  }));

  const sectionTitle = (key: string) => (
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t(key)}</h3>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.03]">
        <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {recruiter ? t("report.disclaimer") : (candidate ?? client)!.disclaimer}
        </p>
      </div>

      {candidate && <p className="text-xs text-gray-400">{t("report.candidateShareHint")}</p>}

      {/* Client : synthèse, points forts, points à explorer */}
      {client && (
        <div className="space-y-4">
          <div>
            {sectionTitle("report.summary")}
            <p className="text-sm text-gray-800 dark:text-gray-200">{client.summary}</p>
          </div>
          {client.highlights.length > 0 && (
            <div>
              {sectionTitle("report.highlights")}
              <ul className="list-disc ps-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {client.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </div>
          )}
          {client.pointsToExplore.length > 0 && (
            <div>
              {sectionTitle("report.pointsToExplore")}
              <ul className="list-disc ps-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {client.pointsToExplore.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tendances principales (patterns) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("report.topPatterns")}</h3>
        <p className="text-xs text-gray-400 mb-3">{t(candidate ? "report.patternsHintCandidate" : "report.patternsHint")}</p>
        {report.topPatterns.length === 0 ? (
          <p className="text-sm text-gray-400">{t("report.noPatterns")}</p>
        ) : (
          <div className="space-y-2">
            {report.topPatterns.map((pattern) => {
              const showDescription =
                t.has(`patterns.${pattern.code}.description`) && !(candidate && TENSION_PATTERNS.has(pattern.code));
              return (
                <div key={pattern.code} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{patternLabel(pattern.code, pattern.label)}</p>
                  {showDescription && (
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                      {t(`patterns.${pattern.code}.description`)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidat : points d'attention formulés positivement */}
      {candidate && candidate.attentionPoints.length > 0 && (
        <div>
          {sectionTitle("report.attentionPoints")}
          <ul className="list-disc ps-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {candidate.attentionPoints.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* 15 dimensions, groupées par catégorie (facettes dépliables pour le recruteur uniquement) */}
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t(`categories.${group.category}`)}</h3>
          <div className="space-y-3">
            {group.dimensions.map((dimension) => {
              const facets = "facets" in dimension ? dimension.facets : null;
              const isOpen = !!facets && !!expanded[dimension.code];
              const percent = dimension.level ? (dimension.level / 5) * 100 : 0;
              const header = (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {label(`dimensions.${dimension.code}`, dimension.name)}
                    </span>
                    <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">{levelLabel(dimension.level)}</span>
                      {dimension.level != null && <span className="text-xs text-gray-400">{dimension.level}/5</span>}
                      {facets && (isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                  </div>
                </>
              );
              return (
                <div key={dimension.code} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                  {facets ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [dimension.code]: !e[dimension.code] }))}
                      className="w-full text-start"
                      aria-expanded={isOpen}
                    >
                      {header}
                    </button>
                  ) : (
                    header
                  )}

                  {isOpen && facets && (
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                      {facets.map((facet) => (
                        <div key={facet.code} className="flex items-center gap-3 text-xs">
                          <span className="w-44 shrink-0 text-gray-600 dark:text-gray-400">{label(`facets.${facet.code}`, facet.name)}</span>
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className="h-full rounded-full bg-brand-400" style={{ width: `${facet.level ? (facet.level / 5) * 100 : 0}%` }} />
                          </div>
                          <span className="w-24 shrink-0 text-end text-gray-500 dark:text-gray-400">{levelLabel(facet.level)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Alignement avec le Job Profile — recruteur (complet) et client (qualitatif) ; jamais candidat */}
      {(recruiter || client) && (() => {
        const alignment = recruiter ? recruiter.alignment : client!.alignment;
        return (
          <div>
            {sectionTitle("report.alignment.title")}
            {!alignment.available ? (
              <p className="text-sm text-gray-400">{alignment.message}</p>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{alignment.disclaimer}</p>
                <div className="space-y-2">
                  {alignment.dimensions.map((d) => (
                    <div key={d.dimension_code} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {label(`dimensions.${d.dimension_code}`, d.dimension_name)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          {recruiter && "importance" in d && (
                            <span className="text-xs text-gray-400">
                              {t("report.alignment.importance", { label: t(`jobProfile.importance.${d.importance}`) })}
                            </span>
                          )}
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ALIGNMENT_CLASSES[d.alignment]}`}>
                            {alignmentLabel(d.alignment)}
                          </span>
                        </span>
                      </div>
                      {d.explanation && <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{d.explanation}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Guide d'entretien — recruteur (3-6 sujets) et client (4 max) */}
      {(recruiter || client) && (() => {
        const topics = recruiter ? recruiter.interviewGuide.topics.map((topic) => topic.text) : client!.interviewTopics;
        if (topics.length === 0) return null;
        return (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("report.interviewGuide.title")}</h3>
            <p className="text-xs text-gray-400 mb-3">{t("report.interviewGuide.hint")}</p>
            <ol className="list-decimal ps-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {topics.map((topic) => <li key={topic}>{topic}</li>)}
            </ol>
          </div>
        );
      })()}

      {/* Recruteur uniquement : réponses brutes + métadonnées internes */}
      {recruiter && (
        <div>
          <button
            type="button"
            onClick={() => setShowResponses((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300"
            aria-expanded={showResponses}
          >
            {t("report.responses.title")}
            {showResponses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showResponses && (
            <div className="mt-3 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t("report.responses.likert")}</p>
                {recruiter.responses.likert.map((r) => (
                  <div key={r.item_code} className="flex items-start gap-3 text-xs">
                    <span className="w-12 shrink-0 font-mono text-gray-400">{r.item_code}</span>
                    <span className="flex-1 text-gray-600 dark:text-gray-400">
                      {r.statement}
                      {r.polarity === "reverse" && <span className="ms-1 text-gray-400">({t("report.responses.reverse")})</span>}
                    </span>
                    <span className="w-8 shrink-0 text-end font-semibold text-gray-700 dark:text-gray-300">{r.response ?? "—"}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t("report.responses.forcedChoice")}</p>
                {recruiter.responses.forcedChoice.map((r) => (
                  <div key={r.block_code} className="flex items-start gap-3 text-xs">
                    <span className="w-12 shrink-0 font-mono text-gray-400">{r.block_code}</span>
                    <span className="flex-1 text-gray-600 dark:text-gray-400">
                      <span className={r.choice === "A" ? "font-semibold text-gray-800 dark:text-gray-200" : ""}>A. {r.a}</span>
                      {" / "}
                      <span className={r.choice === "B" ? "font-semibold text-gray-800 dark:text-gray-200" : ""}>B. {r.b}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 text-[11px] text-gray-400 text-end">
            {t("report.scoringVersion", { version: recruiter.scoringVersion })} · {recruiter.metadata.alignmentVersion} ·{" "}
            {recruiter.metadata.interviewGuideVersion}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";
import { useTranslations } from "next-intl";
import { Check, X, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useGetTestSessionByIdQuery } from "@/lib/services/testSessionApi";
import type { TestSessionStatus, PersonalityDimension } from "@/types/testSession";

const PERSONALITY_ORDER: PersonalityDimension[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
  "pace",
  "leadership",
  "detail_orientation",
  "authority_relation",
  "results_orientation",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
}

const STATUS_COLORS: Record<TestSessionStatus, "info" | "warning" | "success" | "error"> = {
  pending: "info",
  in_progress: "warning",
  completed: "success",
  expired: "error",
};

function ScoreCard({ label, value, accent }: { label: string; value: string; accent?: "success" | "error" }) {
  const color = accent === "success" ? "var(--brand-deep)" : accent === "error" ? "#EF4444" : "var(--text)";
  return (
    <div className="gw-card p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

export default function TestSessionDetailModal({ isOpen, onClose, sessionId }: Props) {
  const t = useTranslations("tests.sessions.detail");
  const tSessions = useTranslations("tests.sessions");

  const { data: session, isLoading } = useGetTestSessionByIdQuery(sessionId ?? "", { skip: !isOpen || !sessionId });

  if (!isOpen || !sessionId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6 sm:p-8 pb-0">
        {isLoading || !session ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Le statut passe sous le nom : il ne doit pas chevaucher la croix de fermeture du popup (en haut à droite) */}
            <div className="pe-10">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {session.candidate_first_name} {session.candidate_last_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{session.candidate_email}</p>
              <div className="mt-2">
                <Badge color={STATUS_COLORS[session.status]} variant="light" size="sm">
                  {tSessions(`statuses.${session.status}`)}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>

      {session && (
        <div className="max-h-[70vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar space-y-6">
          {session.status !== "completed" ? (
            <p className="text-sm text-gray-400 text-center py-8">{t("notCompletedYet")}</p>
          ) : (
            <>
              {session.cheating_detected && (
                <div className="flex items-center gap-2 rounded-xl border border-error-300 bg-error-50 dark:border-error-500/40 dark:bg-error-500/10 px-4 py-3">
                  <AlertTriangle size={18} className="text-error-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-error-600 dark:text-error-400">{t("cheatingDetected")}</p>
                    <p className="text-xs text-error-500">{t("cheatingCount", { count: session.tab_switch_count ?? 0 })}</p>
                  </div>
                </div>
              )}

              {session.type !== "personality" && (
                <div className="grid grid-cols-3 gap-4">
                  <ScoreCard label={t("overallScore")} value={`${session.score ?? 0}%`} accent={(session.score ?? 0) >= 50 ? "success" : "error"} />
                  {session.mcq_score != null && <ScoreCard label={t("mcqScore")} value={`${session.mcq_score}%`} />}
                  {session.coding_score != null && <ScoreCard label={t("codingScore")} value={`${session.coding_score}%`} />}
                </div>
              )}

              {session.personality_dimension_scores && Object.keys(session.personality_dimension_scores).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{tSessions("personalityResultsSection")}</h3>
                  <p className="text-xs text-gray-400 mb-3">{tSessions("personalityResultsHint")}</p>
                  <div className="space-y-3">
                    {PERSONALITY_ORDER.filter((dim) => session.personality_dimension_scores?.[dim]).map((dim) => {
                      const average = session.personality_dimension_scores![dim]!.average;
                      const percent = Math.round(((average - 1) / 4) * 100);
                      return (
                        <div key={dim}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{tSessions(`dimensions.${dim}`)}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{average.toFixed(2)} / 5</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(session.questions || []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("questionsTitle")}</h3>
                  <div className="space-y-3">
                    {(session.questions || []).map((q, index) => {
                      const candidateAnswer = session.answers?.[index];
                      const isCorrect = candidateAnswer === q.correct_answer_index;
                      return (
                        <div key={q.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-xs font-medium text-gray-400">{index + 1}. {q.category}</p>
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400">
                                <Check size={14} /> {t("correct")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-error-500">
                                <X size={14} /> {t("incorrect")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{q.question}</p>
                          <div className="space-y-1.5">
                            {q.options.map((option, optIndex) => {
                              const isTheCorrectOne = optIndex === q.correct_answer_index;
                              const isCandidatePick = optIndex === candidateAnswer;
                              return (
                                <div
                                  key={optIndex}
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                    isTheCorrectOne
                                      ? "border-success-300 bg-success-50 dark:border-success-500/40 dark:bg-success-500/10"
                                      : isCandidatePick
                                        ? "border-error-300 bg-error-50 dark:border-error-500/40 dark:bg-error-500/10"
                                        : "border-gray-200 dark:border-gray-700"
                                  }`}
                                >
                                  {isTheCorrectOne && <Check size={14} className="text-success-600 dark:text-success-400 shrink-0" />}
                                  {isCandidatePick && !isTheCorrectOne && <X size={14} className="text-error-500 shrink-0" />}
                                  <span className={isTheCorrectOne ? "font-medium" : ""}>{option}</span>
                                  {isCandidatePick && (
                                    <span className="ms-auto text-xs text-gray-400">{t("candidateChoice")}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(session.coding_results || []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("codingTitle")}</h3>
                  <div className="space-y-3">
                    {(session.coding_results || []).map((result) => {
                      const passed = result.total > 0 && result.passed === result.total;
                      const challenge = (session.codingChallenges || []).find((c) => c.id === result.challengeId);
                      return (
                        <div key={result.challengeId} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.title}</p>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${passed ? "text-success-600 dark:text-success-400" : "text-error-500"}`}>
                              {passed ? <Check size={14} /> : <X size={14} />}
                              {t("testCasesPassed", { passed: result.passed, total: result.total })}
                            </span>
                          </div>
                          {challenge?.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{challenge.description}</p>
                          )}
                          <pre className="rounded-lg border border-gray-700 bg-gray-900 text-gray-100 font-mono text-xs p-3 overflow-x-auto whitespace-pre-wrap">
                            {result.code || t("noCodeSubmitted")}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>{t("close")}</Button>
      </div>
    </Modal>
  );
}

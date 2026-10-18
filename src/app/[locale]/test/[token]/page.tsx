"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Terminal, Clock, Trophy, ShieldAlert, ChevronLeft } from "lucide-react";
import type {
  PublicTestSession,
  PublicTestQuestion,
  PublicLikertItem,
  PublicForcedChoiceBlock,
  SubmitTestResult,
  ForcedChoiceAnswer,
} from "@/types/testSession";

type Step =
  | { kind: "mcq"; data: PublicTestQuestion }
  | { kind: "likert"; data: PublicLikertItem; index: number }
  | { kind: "forcedChoice"; data: PublicForcedChoiceBlock; index: number };

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1e2530" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}%</span>
      </div>
    </div>
  );
}

export default function PublicTestPage() {
  const t = useTranslations("public.test");
  const tRoot = useTranslations("public");
  const { token } = useParams() as { token: string };

  const [session, setSession] = useState<PublicTestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [likertAnswers, setLikertAnswers] = useState<Record<string, number>>({});
  const [forcedChoiceAnswers, setForcedChoiceAnswers] = useState<Record<string, ForcedChoiceAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitTestResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [cheatingTerminated, setCheatingTerminated] = useState(false);
  const [cheatingHandled, setCheatingHandled] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/public/test-sessions/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: PublicTestSession) => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => { setError(t("notFound")); setLoading(false); });
  }, [token, t]);

  const LIKERT_LABELS: [number, string][] = [
    [1, t("likert1")],
    [2, t("likert2")],
    [3, t("likert3")],
    [4, t("likert4")],
    [5, t("likert5")],
  ];

  const isTalopsia = session?.type === "talopsia";
  const likertItems = useMemo(() => session?.likertItems || [], [session]);
  const forcedChoiceBlocks = useMemo(() => session?.forcedChoiceBlocks || [], [session]);

  // TALOPSIA : 80 affirmations Likert puis 20 blocs à choix forcé, dans l'ordre fixe reçu du serveur.
  const steps: Step[] = useMemo(() => {
    const questions = session?.questions || [];
    return [
      ...questions.map((q): Step => ({ kind: "mcq", data: q })),
      ...likertItems.map((item, index): Step => ({ kind: "likert", data: item, index })),
      ...forcedChoiceBlocks.map((block, index): Step => ({ kind: "forcedChoice", data: block, index })),
    ];
  }, [session, likertItems, forcedChoiceBlocks]);

  const isStepAnswered = (step: Step | undefined): boolean => {
    if (!step) return false;
    if (step.kind === "likert") return likertAnswers[step.data.id] != null;
    if (step.kind === "forcedChoice") return forcedChoiceAnswers[step.data.id] != null;
    return true; // QCM technique : une question peut être laissée sans réponse
  };

  const handleSubmit = async (cheating = false) => {
    if (!session) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = isTalopsia
        ? {
            // Chaque étape TALOPSIA exige une réponse avant de passer à la suivante : toutes les
            // réponses sont donc présentes à la soumission.
            likert_answers: likertItems.map((item) => likertAnswers[item.id]),
            forced_choice_answers: forcedChoiceBlocks.map((block) => forcedChoiceAnswers[block.id]),
          }
        : {
            answers: (session.questions || []).map((q) => (answers[q.id] ?? -1)),
            cheatingDetected: cheating || undefined,
            tabSwitchCount: cheating ? tabSwitchCount + 1 : undefined,
          };
      const res = await fetch(`${API}/public/test-sessions/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data: SubmitTestResult = await res.json();
      setResult(data);
    } catch {
      if (!cheating) setSubmitError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const goToPreviousStep = () => setStepIndex((idx) => Math.max(0, idx - 1));

  const goToNextStep = () => {
    setStepIndex((idx) => {
      if (idx + 1 >= steps.length) {
        handleSubmit();
        return idx;
      }
      return idx + 1;
    });
  };

  // Minuteur par question : redémarre à chaque étape, avance automatiquement à expiration.
  useEffect(() => {
    if (!started || result || cheatingTerminated || steps.length === 0) return;
    const limit = session?.timePerQuestionSeconds;
    if (!limit) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(limit);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [stepIndex, started, result, cheatingTerminated, steps.length, session?.timePerQuestionSeconds]);

  useEffect(() => {
    if (timeLeft === 0) goToNextStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Détection de changement d'onglet : interdit pendant un test technique, considéré comme de la
  // triche. Non appliquée à TALOPSIA (questionnaire sans bonne réponse : rien à rechercher ailleurs,
  // et une clôture forcée perdrait un profil presque complet).
  useEffect(() => {
    if (!started || result || cheatingTerminated || cheatingHandled || isTalopsia) return;
    const onVisibilityChange = () => {
      if (document.hidden) {
        setCheatingHandled(true);
        setCheatingTerminated(true);
        setTabSwitchCount((c) => c + 1);
        handleSubmit(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, result, cheatingTerminated, cheatingHandled, answers, isTalopsia]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin" />
          {t("loading")}
        </div>
      </div>
    );
  }
  if (error || !session) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-red-400">{error || t("genericError")}</div>;
  }

  if (session.status === "completed" && !result && !cheatingTerminated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#11151d] p-8 text-center">
          <Check size={40} className="mx-auto mb-3 text-emerald-500" />
          <h1 className="text-xl font-bold text-white mb-2">{t("alreadyCompletedTitle")}</h1>
          <p className="text-sm text-gray-400">{t("alreadyCompletedMessage")}</p>
        </div>
      </div>
    );
  }

  if (cheatingTerminated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-[#11151d] p-8 text-center">
          <ShieldAlert size={40} className="mx-auto mb-3 text-red-500" />
          <h1 className="text-xl font-bold text-white mb-2">{t("cheatingResultTitle")}</h1>
          <p className="text-sm text-gray-400 leading-relaxed">{t("cheatingResultMessage")}</p>
        </div>
      </div>
    );
  }

  if (result) {
    // TALOPSIA : aucun score ni profil n'est montré au candidat — simple écran de remerciement.
    if (isTalopsia || result.score == null) {
      return (
        <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#11151d] p-8 text-center">
            <Check size={40} className="mx-auto mb-3 text-emerald-500" />
            <h1 className="text-xl font-bold text-white mb-2">{t("talopsiaResultTitle")}</h1>
            <p className="text-sm text-gray-400 leading-relaxed">{t("talopsiaResultMessage")}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#11151d] p-8 text-center">
          <Trophy size={28} className="mx-auto mb-2 text-amber-400" />
          <h1 className="text-xl font-bold text-white mb-1">{t("resultTitle")}</h1>
          <p className="text-sm text-gray-400 mb-6">{t("resultMessage")}</p>
          <ScoreRing score={result.score} />
          <div className="mt-6 flex justify-center gap-6 text-xs text-gray-400">
            {result.mcqScore != null && (
              <span className="rounded-full bg-white/5 px-3 py-1.5">{t("mcqScoreLabel", { score: result.mcqScore })}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    const totalItems = steps.length;
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-[#11151d] p-10 text-center relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Terminal size={26} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{isTalopsia ? t("talopsiaWelcomeTitle") : t("welcomeTitle")}</h1>
          {session.candidateName && <p className="text-sm text-gray-400 mb-4">{t("welcomeGreeting", { name: session.candidateName })}</p>}
          {isTalopsia ? (
            <>
              <p className="text-sm text-gray-400 mb-2 leading-relaxed">
                {t("talopsiaInstructions", { likert: likertItems.length, blocks: forcedChoiceBlocks.length })}
              </p>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">{t("talopsiaNoRightAnswer")}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-2 leading-relaxed">{t("instructions", { count: totalItems })}</p>
              {session.timePerQuestionSeconds ? (
                <p className="text-sm text-emerald-400 mb-2 leading-relaxed">{t("timerNotice", { seconds: session.timePerQuestionSeconds })}</p>
              ) : (
                <p className="text-sm text-gray-500 mb-2 leading-relaxed">{t("takeYourTime")}</p>
              )}
              <p className="text-xs text-red-400/80 mb-8 leading-relaxed">{t("tabSwitchNotice")}</p>
            </>
          )}
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-[#0b0e14] hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            {t("startButton")}
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-8">{tRoot("poweredBy")}</p>
      </div>
    );
  }

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const canAdvance = isStepAnswered(currentStep);
  const answeredCount = isTalopsia
    ? Object.keys(likertAnswers).length + Object.keys(forcedChoiceAnswers).length
    : stepIndex;
  const progressPercent = steps.length > 0 ? Math.round((answeredCount / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0e14]/95 backdrop-blur px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Terminal size={18} className="text-emerald-400" />
            <h1 className="text-sm font-semibold">{isTalopsia ? t("talopsiaTitle") : t("title")}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isTalopsia ? (
              // 100 interactions : une barre continue plutôt qu'un segment par question
              <div className="hidden sm:block w-40 h-1.5 rounded-full bg-white/10 overflow-hidden" aria-hidden>
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1">
                {steps.map((_, i) => (
                  <span key={i} className={`h-1.5 w-4 rounded-full ${i < stepIndex ? "bg-emerald-500" : i === stepIndex ? "bg-emerald-500/50" : "bg-white/10"}`} />
                ))}
              </div>
            )}
            <span className="text-xs text-gray-400">{t("questionProgress", { current: stepIndex + 1, total: steps.length })}</span>
            {timeLeft !== null && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${timeLeft <= 10 ? "bg-red-500/15 text-red-400" : "bg-white/5 text-gray-300"}`}>
                <Clock size={12} /> {timeLeft}s
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {submitError && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{submitError}</p>
        )}

        {currentStep.kind === "mcq" && (
          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                {stepIndex + 1}
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{currentStep.data.category}</span>
            </div>
            <p className="text-base font-medium text-white mb-5">{currentStep.data.question}</p>
            <div className="space-y-2">
              {currentStep.data.options.map((option, optIndex) => {
                const isSelected = answers[currentStep.data.id] === optIndex;
                return (
                  <label
                    key={optIndex}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-white/10 text-gray-300 hover:border-white/25 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        isSelected ? "border-emerald-400 bg-emerald-400" : "border-gray-600"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-[#0b0e14]" strokeWidth={3} />}
                    </span>
                    <input
                      type="radio"
                      name={`q-${currentStep.data.id}`}
                      checked={isSelected}
                      onChange={() => setAnswers((a) => ({ ...a, [currentStep.data.id]: optIndex }))}
                      className="hidden"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.kind === "likert" && (
          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("likertStepLabel", { n: currentStep.index + 1, total: likertItems.length })}
              </span>
            </div>
            <p className="text-base font-medium text-white mb-2">{currentStep.data.statement}</p>
            <p className="text-xs text-gray-500 mb-5">{t("likertInstruction")}</p>
            <div className="grid grid-cols-5 gap-2">
              {LIKERT_LABELS.map(([value, label]) => {
                const isSelected = likertAnswers[currentStep.data.id] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLikertAnswers((a) => ({ ...a, [currentStep.data.id]: value }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-colors ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-white/10 text-gray-400 hover:border-white/25 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${
                        isSelected ? "border-emerald-400 bg-emerald-400 text-[#0b0e14]" : "border-gray-600"
                      }`}
                    >
                      {value}
                    </span>
                    <span className="text-[11px] leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.kind === "forcedChoice" && (
          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("forcedChoiceStepLabel", { n: currentStep.index + 1, total: forcedChoiceBlocks.length })}
              </span>
            </div>
            <p className="text-base font-medium text-white mb-5">{t("forcedChoiceInstruction")}</p>
            <div className="space-y-3">
              {(["A", "B"] as const).map((option) => {
                const isSelected = forcedChoiceAnswers[currentStep.data.id] === option;
                const text = option === "A" ? currentStep.data.a : currentStep.data.b;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForcedChoiceAnswers((a) => ({ ...a, [currentStep.data.id]: option }))}
                    className={`w-full flex items-start gap-3 rounded-xl border px-4 py-4 text-start text-sm transition-colors ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-white/10 text-gray-300 hover:border-white/25 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        isSelected ? "border-emerald-400 bg-emerald-400 text-[#0b0e14]" : "border-gray-600 text-gray-400"
                      }`}
                    >
                      {option}
                    </span>
                    <span className="leading-relaxed">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-8">
          {isTalopsia ? (
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={submitting || stepIndex === 0}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> {t("previousButton")}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={13} /> {timeLeft !== null ? t("timeLeftLabel") + `: ${timeLeft}s` : t("takeYourTime")}
            </span>
          )}
          <button
            type="button"
            onClick={goToNextStep}
            disabled={submitting || !canAdvance}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-[#0b0e14] hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? t("submitting") : isLastStep ? t("finishButton") : t("nextButton")}
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-10 pb-6">{tRoot("poweredBy")}</p>
      </div>
    </div>
  );
}

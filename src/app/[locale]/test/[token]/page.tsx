"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Code2, Terminal, Clock, Trophy, ShieldAlert } from "lucide-react";

interface PublicQuestion {
  id: string;
  type: string;
  category: string;
  question: string;
  options: string[];
}

interface PublicCodingChallenge {
  id: string;
  domain: string;
  title: string;
  description: string;
  language: string;
  starter_code: string;
}

interface PublicPersonalityItem {
  id: string;
  statement: string;
}

interface PersonalityDimensionScore {
  average: number;
  count: number;
}

interface PublicSession {
  status: "pending" | "in_progress" | "completed" | "expired";
  candidateName?: string;
  timePerQuestionSeconds?: number | null;
  questions?: PublicQuestion[];
  codingChallenges?: PublicCodingChallenge[];
  personalityItems?: PublicPersonalityItem[];
}

interface SubmitResult {
  score: number;
  mcqScore: number | null;
  codingScore: number | null;
  personalityDimensionScores?: Record<string, PersonalityDimensionScore> | null;
}

type Step =
  | { kind: "mcq"; data: PublicQuestion }
  | { kind: "coding"; data: PublicCodingChallenge }
  | { kind: "personality"; data: PublicPersonalityItem };

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

  const [session, setSession] = useState<PublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, number>>({});
  const [codeByChallenge, setCodeByChallenge] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
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
      .then((data: PublicSession) => {
        setSession(data);
        const initialCode: Record<string, string> = {};
        (data.codingChallenges || []).forEach((c) => { initialCode[c.id] = c.starter_code; });
        setCodeByChallenge(initialCode);
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

  const steps: Step[] = useMemo(() => {
    const questions = session?.questions || [];
    const challenges = session?.codingChallenges || [];
    const personalityItems = session?.personalityItems || [];
    return [
      ...questions.map((q): Step => ({ kind: "mcq", data: q })),
      ...challenges.map((c): Step => ({ kind: "coding", data: c })),
      ...personalityItems.map((p): Step => ({ kind: "personality", data: p })),
    ];
  }, [session]);

  const handleSubmit = async (cheating = false) => {
    if (!session) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const orderedAnswers = (session.questions || []).map((q) => (answers[q.id] ?? -1));
      const codeSubmissions = (session.codingChallenges || []).map((c) => ({ challengeId: c.id, code: codeByChallenge[c.id] || "" }));
      // Réponse neutre (3) par défaut si un item de personnalité n'a pas été répondu, pour rester
      // cohérent avec le comportement permissif des QCM (skippables) plutôt que de bloquer l'envoi.
      const orderedPersonalityAnswers = (session.personalityItems || []).map((p) => (personalityAnswers[p.id] ?? 3));
      const res = await fetch(`${API}/public/test-sessions/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: orderedAnswers,
          personality_answers: orderedPersonalityAnswers,
          codeSubmissions,
          cheatingDetected: cheating || undefined,
          tabSwitchCount: cheating ? tabSwitchCount + 1 : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const data: SubmitResult = await res.json();
      setResult(data);
    } catch {
      if (!cheating) setSubmitError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

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

  // Détection de changement d'onglet : interdit pendant le test, considéré comme de la triche.
  useEffect(() => {
    if (!started || result || cheatingTerminated || cheatingHandled) return;
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
  }, [started, result, cheatingTerminated, cheatingHandled, answers, codeByChallenge]);

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
    // Session de personnalité pure (pas de QCM/code) : pas de score global pertinent, on
    // affiche un simple écran de remerciement — le recruteur consultera le détail par dimension.
    if (result.mcqScore == null && result.codingScore == null && result.personalityDimensionScores) {
      return (
        <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#11151d] p-8 text-center">
            <Check size={40} className="mx-auto mb-3 text-emerald-500" />
            <h1 className="text-xl font-bold text-white mb-2">{t("personalityResultTitle")}</h1>
            <p className="text-sm text-gray-400 leading-relaxed">{t("personalityResultMessage")}</p>
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
            {result.codingScore != null && (
              <span className="rounded-full bg-white/5 px-3 py-1.5">{t("codingScoreLabel", { score: result.codingScore })}</span>
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
          <h1 className="text-2xl font-bold text-white mb-2">{t("welcomeTitle")}</h1>
          {session.candidateName && <p className="text-sm text-gray-400 mb-4">{t("welcomeGreeting", { name: session.candidateName })}</p>}
          <p className="text-sm text-gray-400 mb-2 leading-relaxed">{t("instructions", { count: totalItems })}</p>
          {session.timePerQuestionSeconds ? (
            <p className="text-sm text-emerald-400 mb-2 leading-relaxed">{t("timerNotice", { seconds: session.timePerQuestionSeconds })}</p>
          ) : (
            <p className="text-sm text-gray-500 mb-2 leading-relaxed">{t("takeYourTime")}</p>
          )}
          <p className="text-xs text-red-400/80 mb-8 leading-relaxed">{t("tabSwitchNotice")}</p>
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

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0e14]/95 backdrop-blur px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Terminal size={18} className="text-emerald-400" />
            <h1 className="text-sm font-semibold">{t("title")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              {steps.map((_, i) => (
                <span key={i} className={`h-1.5 w-4 rounded-full ${i < stepIndex ? "bg-emerald-500" : i === stepIndex ? "bg-emerald-500/50" : "bg-white/10"}`} />
              ))}
            </div>
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

        {currentStep.kind === "personality" && (
          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                {stepIndex + 1}
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("personalityStepLabel", { n: stepIndex + 1 })}</span>
            </div>
            <p className="text-base font-medium text-white mb-2">{currentStep.data.statement}</p>
            <p className="text-xs text-gray-500 mb-5">{t("personalityInstruction")}</p>
            <div className="grid grid-cols-5 gap-2">
              {LIKERT_LABELS.map(([value, label]) => {
                const isSelected = personalityAnswers[currentStep.data.id] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPersonalityAnswers((a) => ({ ...a, [currentStep.data.id]: value }))}
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

        {currentStep.kind === "coding" && (
          <div className="rounded-2xl border border-white/10 bg-[#11151d] overflow-hidden">
            <div className="p-5 pb-4 border-b border-white/5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Code2 size={13} className="text-emerald-400" /> {t("codingChallengeLabel", { n: stepIndex + 1 })} · {currentStep.data.domain}
              </p>
              <p className="text-sm font-semibold text-white mb-1">{currentStep.data.title}</p>
              <p className="text-sm text-gray-400 whitespace-pre-wrap break-words leading-relaxed">{currentStep.data.description}</p>
            </div>
            <div className="bg-[#0d1117]">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ms-2 text-xs text-gray-500 font-mono">solution.{currentStep.data.language === "python" ? "py" : "js"}</span>
              </div>
              <textarea
                value={codeByChallenge[currentStep.data.id] ?? currentStep.data.starter_code}
                onChange={(e) => setCodeByChallenge((prev) => ({ ...prev, [currentStep.data.id]: e.target.value }))}
                spellCheck={false}
                rows={16}
                className="w-full bg-transparent text-gray-100 font-mono text-sm p-4 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-8">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Clock size={13} /> {timeLeft !== null ? t("timeLeftLabel") + `: ${timeLeft}s` : t("takeYourTime")}
          </span>
          <button
            type="button"
            onClick={goToNextStep}
            disabled={submitting}
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

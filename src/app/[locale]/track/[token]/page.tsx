"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface Tracking {
  candidate: { first_name: string; last_name: string };
  offer_title?: string | null;
  submitted_at?: string;
  status: string;
  current_step?: string | null;
  history: { status: string; date?: string; comment?: string | null }[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function TrackPage() {
  const t = useTranslations("public.track");
  const tRoot = useTranslations("public");
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/public/applications/track/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(t("notFound")))
      .finally(() => setLoading(false));
  }, [token, t]);

  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t("loading")}</div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || t("genericError")}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.candidate.first_name} {data.candidate.last_name}
            {data.offer_title ? ` — ${data.offer_title}` : ""}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-brand-50 text-brand-700">
              {t("status", { status: data.status })}
            </span>
            {data.current_step && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {t("step", { step: data.current_step })}
              </span>
            )}
          </div>
          {data.submitted_at && (
            <p className="mt-3 text-xs text-gray-400">{t("receivedOn", { date: fmt(data.submitted_at) })}</p>
          )}

          {/* Timeline historique */}
          {data.history.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t("history")}</h2>
              <ol className="relative border-s border-gray-200 ms-2">
                {data.history.map((h, i) => (
                  <li key={i} className="mb-5 ms-4">
                    <span className="absolute -start-1.5 w-3 h-3 rounded-full bg-brand-500" />
                    <p className="text-sm font-medium text-gray-800">{h.status}</p>
                    {h.date && <p className="text-xs text-gray-400">{fmt(h.date)}</p>}
                    {h.comment && <p className="text-sm text-gray-600 mt-0.5">{h.comment}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">{tRoot("poweredBy")}</p>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import type { PublicApplication } from "@/types/publicJobOffer";

interface ApplicationsListProps {
  applications: PublicApplication[];
}

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filteredApplications = applications.filter((app) =>
    sourceFilter === "all" ? true : app.source === sourceFilter
  );

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      qr: "QR Code",
      direct: "Lien direct",
      linkedin: "LinkedIn",
      other: "Autre",
    };
    return labels[source] || source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, "info" | "success" | "warning" | "light"> = {
      qr: "info",
      direct: "success",
      linkedin: "info",
      other: "light",
    };
    return colors[source] || "light";
  };

  const downloadCV = (cvPath: string, candidateName: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const link = document.createElement("a");
    link.href = `${apiUrl}/${cvPath}`;
    link.download = `CV-${candidateName}.pdf`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Filtrer par source:</span>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="all">Toutes</option>
          <option value="qr">QR Code</option>
          <option value="direct">Lien direct</option>
          <option value="linkedin">LinkedIn</option>
          <option value="other">Autre</option>
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {filteredApplications.length} candidature{filteredApplications.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Liste des candidatures */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      {application.first_name} {application.last_name}
                    </h4>
                    <Badge
                      color={getSourceColor(application.source)}
                      variant="light"
                      size="sm"
                    >
                      {getSourceLabel(application.source)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <span>📧</span>
                      <a
                        href={`mailto:${application.email}`}
                        className="hover:text-brand-600 dark:hover:text-brand-400"
                      >
                        {application.email}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📱</span>
                      <a
                        href={`tel:${application.phone}`}
                        className="hover:text-brand-600 dark:hover:text-brand-400"
                      >
                        {application.phone}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📅</span>
                      {new Date(application.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {application.message && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {application.message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {application.cv_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadCV(
                          application.cv_path!,
                          `${application.first_name}-${application.last_name}`
                        )
                      }
                      startIcon={<DownloadIcon />}
                    >
                      CV
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${application.email}`, "_blank")}
                    startIcon={<EmailIcon />}
                  >
                    Contacter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune candidature pour ce filtre
          </p>
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M17.5 12.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V12.5M14.1667 8.33333L10 12.5M10 12.5L5.83333 8.33333M10 12.5V2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M1.66669 5.83333L8.47085 10.5962C9.02389 10.9819 9.30041 11.1747 9.59919 11.2494C9.86144 11.3154 10.1386 11.3154 10.4009 11.2494C10.6997 11.1747 10.9762 10.9819 11.5292 10.5962L18.3334 5.83333M5.66669 16.6667H14.3334C15.7335 16.6667 16.4336 16.6667 16.9683 16.3942C17.4387 16.1545 17.8212 15.7721 18.0609 15.3017C18.3334 14.7669 18.3334 14.0668 18.3334 12.6667V7.33333C18.3334 5.93319 18.3334 5.23313 18.0609 4.69835C17.8212 4.22795 17.4387 3.8455 16.9683 3.60582C16.4336 3.33333 15.7335 3.33333 14.3334 3.33333H5.66669C4.26656 3.33333 3.56649 3.33333 3.03171 3.60582C2.56131 3.8455 2.17886 4.22795 1.93918 4.69835C1.66669 5.23313 1.66669 5.93319 1.66669 7.33333V12.6667C1.66669 14.0668 1.66669 14.7669 1.93918 15.3017C2.17886 15.7721 2.56131 16.1545 3.03171 16.3942C3.56649 16.6667 4.26656 16.6667 5.66669 16.6667Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

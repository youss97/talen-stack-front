"use client";
import { useState, useMemo, useEffect } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import type { PublicApplication } from "@/types/publicJobOffer";

interface ApplicationsListProps {
  applications: PublicApplication[];
  /** Transformer une candidature publique en vraie candidature */
  onConvert?: (id: string) => void;
  convertingId?: string | null;
}

export default function ApplicationsList({ applications, onConvert, convertingId }: ApplicationsListProps) {
  const filteredApplications = applications;

  // Pagination côté client
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  // Revenir à la 1ʳᵉ page si la liste rétrécit sous la page courante
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pagedApplications = useMemo(
    () => filteredApplications.slice((page - 1) * pageSize, page * pageSize),
    [filteredApplications, page, pageSize]
  );

  const downloadCV = (cvPath: string, firstName: string, lastName: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const year = new Date().getFullYear();
    const f = (firstName || "Prenom").replace(/\s+/g, "");
    const l = (lastName || "Nom").replace(/\s+/g, "").toUpperCase();
    const ext = cvPath.split(".").pop()?.split("?")[0]?.toLowerCase() || "pdf";
    const link = document.createElement("a");
    link.href = `${apiUrl}/${cvPath}`;
    // Format standard : CV_Prénom_NOM_Année (poste non disponible pour une candidature publique)
    link.download = `CV_${f}_${l}_${year}.${ext}`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Compteur */}
      <div className="flex items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {filteredApplications.length} candidature{filteredApplications.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Tableau des candidatures */}
      {filteredApplications.length > 0 ? (
        <div className="w-full overflow-x-auto gw-card">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Candidat</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Contact</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Reçue le</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedApplications.map((application) => {
                const synced = (application as { synced_application_id?: string }).synced_application_id;
                return (
                  <tr key={application.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {application.first_name} {application.last_name}
                      </div>
                      {application.message && (
                        <div className="text-xs text-gray-400 max-w-[220px] truncate" title={application.message}>
                          💬 {application.message}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${application.email}`} className="block text-gray-700 dark:text-gray-300 hover:text-brand-600 truncate max-w-[200px]">
                        {application.email}
                      </a>
                      {application.phone && (
                        <a href={`tel:${application.phone}`} className="block text-xs text-gray-400 hover:text-brand-600">
                          {application.phone}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(application.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {application.cv_path && (
                          <Button variant="outline" size="sm"
                            onClick={() => downloadCV(application.cv_path!, application.first_name, application.last_name)}
                            startIcon={<DownloadIcon />}>
                            CV
                          </Button>
                        )}
                        {onConvert && (
                          synced ? (
                            <Badge color="success" variant="light" size="sm">✓ Transformée</Badge>
                          ) : (
                            <Button size="sm" onClick={() => onConvert(application.id)} disabled={convertingId === application.id}>
                              {convertingId === application.id ? "..." : "→ Candidature"}
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 gw-card">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune candidature pour ce filtre
          </p>
        </div>
      )}

      {filteredApplications.length > 0 && (
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredApplications.length}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            onItemsPerPageChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
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

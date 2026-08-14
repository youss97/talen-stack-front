"use client";
import { useState, useMemo, useEffect } from "react";
import { Download, Trash2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { Link } from "@/i18n/navigation";
import PublicApplicationDetailModal from "./PublicApplicationDetailModal";
import type { PublicApplication } from "@/types/publicJobOffer";
import { formatDateTime } from "@/utils/dateFormat";

interface ApplicationsListProps {
  applications: PublicApplication[];
  /** Intitulé de l'offre (toutes les candidatures de cette liste postulent à la même offre) —
   * utilisé pour la nomenclature du nom de fichier CV téléchargé, alignée sur celle du vivier. */
  offerTitle?: string;
  /** Transformer une candidature publique en vraie candidature */
  onConvert?: (id: string) => void;
  convertingId?: string | null;
  /** Supprimer une candidature publique (non transformée) */
  onDelete?: (application: PublicApplication) => void;
  deletingId?: string | null;
}

// Retire les accents/diacritiques pour un nom de fichier ASCII sûr — même logique que
// talent-backend/src/cvs/cvs.service.ts:downloadCv, pour garder la même nomenclature.
const deburr = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function ApplicationsList({ applications, offerTitle, onConvert, convertingId, onDelete, deletingId }: ApplicationsListProps) {
  const t = useTranslations("publicOffers.applications");
  const filteredApplications = applications;

  const [detailApplication, setDetailApplication] = useState<PublicApplication | null>(null);

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

  const downloadCV = async (cvPath: string, firstName: string, lastName: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const year = new Date().getFullYear();
    const f = deburr(firstName || "Prenom").replace(/\s+/g, "");
    const l = deburr(lastName || "Nom").replace(/\s+/g, "").toUpperCase();
    const position = deburr(offerTitle || "Poste")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 40);
    const ext = cvPath.split(".").pop()?.split("?")[0]?.toLowerCase() || "pdf";
    const filename = `CV_${f}_${l}_${position}_${year}.${ext}`;
    const fileUrl = `${apiUrl}/${cvPath}`;
    try {
      // Fetch + blob : un simple <a href download> sur une URL cross-origin (localhost:4000
      // vs le front) est ignoré par le navigateur, qui garde le nom de fichier du serveur.
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback : ouvrir le fichier tel quel si le fetch échoue (CORS, etc.)
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Compteur */}
      <div className="flex items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400 ms-auto">
          {t("count", { count: filteredApplications.length })}
        </span>
      </div>

      {/* Tableau des candidatures */}
      {filteredApplications.length > 0 ? (
        <div className="w-full overflow-x-auto gw-card">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-start" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t("table.candidate")}</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t("table.contact")}</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t("table.receivedOn")}</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t("table.referrer")}</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-end">{t("table.actions")}</th>
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
                      {formatDateTime(application.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {application.referrer ? `${application.referrer.first_name} ${application.referrer.last_name}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm"
                          onClick={() => setDetailApplication(application)}
                          startIcon={<Eye className="icon-glow" size={16} strokeWidth={1.8} />}>
                          {t("details")}
                        </Button>
                        {application.cv_path && (
                          <Button variant="outline" size="sm"
                            onClick={() => downloadCV(application.cv_path!, application.first_name, application.last_name)}
                            startIcon={<DownloadIcon />}>
                            {t("cv")}
                          </Button>
                        )}
                        {onConvert && (
                          synced ? (
                            <Link href={`/applications/${synced}`}>
                              <Badge color="success" variant="light" size="sm">✓ {t("converted")}</Badge>
                            </Link>
                          ) : (
                            <Button size="sm" onClick={() => onConvert(application.id)} disabled={convertingId === application.id}>
                              {convertingId === application.id ? "..." : t("convert")}
                            </Button>
                          )
                        )}
                        {onDelete && !synced && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(application)}
                            disabled={deletingId === application.id}
                            startIcon={<TrashIcon />}
                          >
                            {deletingId === application.id ? "..." : t("delete")}
                          </Button>
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
            {t("empty")}
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

      <PublicApplicationDetailModal
        isOpen={!!detailApplication}
        onClose={() => setDetailApplication(null)}
        application={detailApplication}
        onDownloadCv={(app) => app.cv_path && downloadCV(app.cv_path, app.first_name, app.last_name)}
      />
    </div>
  );
}

function DownloadIcon() {
  return <Download className="icon-glow" size={16} strokeWidth={1.8} />;
}

function TrashIcon() {
  return <Trash2 className="icon-glow" size={16} strokeWidth={1.8} />;
}

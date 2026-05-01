"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { formatDate } from "@/utils/dateFormat";
import {
  useGetPublicJobOffersQuery,
  useTogglePublicJobOfferActiveMutation,
} from "@/lib/services/publicJobOfferApi";
import type { PublicJobOffer } from "@/types/publicJobOffer";

export default function PublicOffersPage() {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useGetPublicJobOffersQuery({
    page,
    limit: 5,
    search: search || undefined,
  });

  const [toggleActive] = useTogglePublicJobOfferActiveMutation();

  const addToast = useCallback((
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleToggleActive = async (offer: PublicJobOffer) => {
    try {
      await toggleActive(offer.id).unwrap();
      addToast(
        "success",
        "Succès",
        `Offre ${offer.is_public ? "rendue privée" : "rendue publique"} avec succès`
      );
    } catch (error) {
      addToast("error", "Erreur", "Erreur lors de la modification");
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    addToast("success", "Lien copié", "Le lien a été copié dans le presse-papier");
  };

  const columns: Column<PublicJobOffer>[] = [
    {
      key: "title",
      header: "Titre",
      className: "font-medium",
    },
    {
      key: "client.name",
      header: "Client",
      render: (_, row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.client?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Localisation",
    },
    {
      key: "contract_type",
      header: "Type de contrat",
    },
    {
      key: "is_public",
      header: "Statut",
      render: (value) => (
        <Badge
          color={value ? "success" : "error"}
          variant="light"
          size="sm"
        >
          {value ? "Publique" : "Privée"}
        </Badge>
      ),
    },
    {
      key: "public_views_count",
      header: "Vues",
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {(value as number) || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date de création",
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {formatDate(value as string)}
        </span>
      ),
    },
  ];

  const customActions = [
    {
      label: "Voir l'offre",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: (offer: PublicJobOffer) => {
        if (offer.is_public && offer.public_slug) {
          const url = `${window.location.origin}/apply/${offer.public_slug}`;
          window.open(url, '_blank');
        } else {
          addToast("warning", "Attention", "Cette offre n'est pas publique ou n'a pas de slug");
        }
      },
    },
    {
      label: "Copier lien",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      onClick: (offer: PublicJobOffer) => {
        if (offer.is_public && offer.public_slug) {
          copyLink(offer.public_slug);
        } else {
          addToast("warning", "Attention", "Cette offre n'est pas publique ou n'a pas de slug");
        }
      },
    },
    {
      label: "QR Code",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      onClick: (offer: PublicJobOffer) => {
        if (offer.is_public && offer.public_slug) {
          router.push(`/public-offers/${offer.id}`);
        } else {
          addToast("warning", "Attention", "Cette offre n'est pas publique ou n'a pas de slug");
        }
      },
    },
    {
      label: "Basculer statut",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      onClick: handleToggleActive,
    },
  ];

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Offres Publiques
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez vos offres d'emploi publiques avec QR code
            </p>
          </div>
          <Button
            onClick={() => router.push("/recruitment-requests")}
            startIcon={<PlusIcon />}
          >
            Voir les demandes de recrutement
          </Button>
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par titre..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
          </div>
        </div>

        <DataTable<PublicJobOffer>
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          customActions={customActions}
          emptyMessage="Aucune offre publique trouvée"
        />

        {data && data.pagination && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 4.16667V15.8333M4.16667 10H15.8333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

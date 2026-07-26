"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FolderOpen, Eye, Link2, Settings, RefreshCw, Plus } from "lucide-react";
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
import PublicOfferConfigModal from "@/components/public-offers/PublicOfferConfigModal";

export default function PublicOffersPage() {
  const t = useTranslations("publicOffers.list");
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [configOffer, setConfigOffer] = useState<PublicJobOffer | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetPublicJobOffersQuery({
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
        t("toast.success"),
        t("toast.toggleSuccess", { status: offer.is_public ? t("toast.madePrivate") : t("toast.madePublic") })
      );
    } catch (error) {
      addToast("error", t("toast.error"), t("toast.toggleError"));
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    addToast("success", t("toast.linkCopied"), t("toast.linkCopiedMessage"));
  };

  const columns: Column<PublicJobOffer>[] = [
    {
      key: "title",
      header: t("columns.title"),
      className: "font-medium",
    },
    {
      key: "client.name",
      header: t("columns.client"),
      render: (_, row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.client?.name || t("notAvailable")}
        </span>
      ),
    },
    {
      key: "location",
      header: t("columns.location"),
    },
    {
      key: "contract_type",
      header: t("columns.contractType"),
    },
    {
      key: "is_public",
      header: t("columns.status"),
      render: (value) => (
        <Badge
          color={value ? "success" : "error"}
          variant="light"
          size="sm"
        >
          {value ? t("statusPublic") : t("statusPrivate")}
        </Badge>
      ),
    },
    {
      key: "public_views_count",
      header: t("columns.views"),
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {(value as number) || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: t("columns.createdAt"),
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {formatDate(value as string)}
        </span>
      ),
    },
  ];

  const customActions = [
    {
      label: t("actions.detailsAndApplications"),
      icon: <FolderOpen size={16} strokeWidth={1.8} className="icon-glow" />,
      onClick: (offer: PublicJobOffer) => router.push(`/public-offers/${offer.id}`),
    },
    {
      label: t("actions.viewOffer"),
      icon: <Eye size={16} strokeWidth={1.8} className="icon-glow" />,
      onClick: (offer: PublicJobOffer) => {
        if (offer.is_public && offer.public_slug) {
          const url = `${window.location.origin}/apply/${offer.public_slug}`;
          window.open(url, '_blank');
        } else {
          addToast("warning", t("toast.attention"), t("toast.notPublicWarning"));
        }
      },
    },
    {
      label: t("actions.copyLink"),
      icon: <Link2 size={16} strokeWidth={1.8} className="icon-glow" />,
      onClick: (offer: PublicJobOffer) => {
        if (offer.is_public && offer.public_slug) {
          copyLink(offer.public_slug);
        } else {
          addToast("warning", t("toast.attention"), t("toast.notPublicWarning"));
        }
      },
    },
    {
      label: t("actions.configure"),
      icon: <Settings size={16} strokeWidth={1.8} className="icon-glow" />,
      onClick: (offer: PublicJobOffer) => setConfigOffer(offer),
    },
    {
      label: t("actions.toggleStatus"),
      icon: <RefreshCw size={16} strokeWidth={1.8} className="icon-glow" />,
      onClick: handleToggleActive,
    },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={() => router.push("/recruitment-requests")}
            startIcon={<PlusIcon />}
          >
            {t("viewRecruitmentRequests")}
          </Button>
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
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
          emptyMessage={t("emptyMessage")}
        />

        {data && data.pagination && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
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

      <PublicOfferConfigModal
        isOpen={!!configOffer}
        onClose={() => setConfigOffer(null)}
        offerId={configOffer?.id ?? null}
        initialVisibleFields={configOffer?.public_visible_fields}
        onSaved={() => { addToast("success", t("toast.success"), t("toast.configSaved")); refetch(); }}
      />
    </div>
  );
}

function PlusIcon() {
  return <Plus size={20} strokeWidth={1.8} className="icon-glow" />;
}

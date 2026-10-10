"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import RecruiterDetailModal from "@/components/recruiter/RecruiterDetailModal";
import { ArrowLeft } from "lucide-react";

export default function ApplicationDetailPage() {
  const t = useTranslations("applications");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  // Ouverte depuis le Kanban : on y revient (et non à la liste)
  const [openedFromKanban] = useState(() => searchParams.get("from") === "kanban");
  const backHref = openedFromKanban ? "/applications?view=kanban" : "/applications";

  return (
    <div className="w-full">
      <button
        onClick={() => router.push(backHref)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="rtl:rotate-180 icon-glow" size={16} strokeWidth={1.8} />
        {t("detailPage.backLink")}
      </button>

      <RecruiterDetailModal
        isOpen={true}
        asPage
        recruiterId={id}
        onClose={() => router.push(backHref)}
      />
    </div>
  );
}

"use client";
import { useParams, useRouter } from "next/navigation";
import RecruiterDetailModal from "@/components/recruiter/RecruiterDetailModal";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <div className="w-full">
      <button
        onClick={() => router.push("/applications")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux candidatures
      </button>

      <RecruiterDetailModal
        isOpen={true}
        asPage
        recruiterId={id}
        onClose={() => router.push("/applications")}
      />
    </div>
  );
}

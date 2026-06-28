"use client";
import { useParams, useRouter } from "next/navigation";
import RecruiterDetailModal from "@/components/recruiter/RecruiterDetailModal";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950/40">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button
          onClick={() => router.push("/applications")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux candidatures
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <RecruiterDetailModal
            isOpen={true}
            asPage
            recruiterId={id}
            onClose={() => router.push("/applications")}
          />
        </div>
      </div>
    </div>
  );
}

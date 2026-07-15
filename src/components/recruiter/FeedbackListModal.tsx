"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import FeedbackModal from "./FeedbackModal";
import { formatDateTime } from "@/utils/dateFormat";
import { getFeedbackCardColor } from "@/utils/feedbackColors";
import type { ApplicationFeedback } from "@/types/recruiter";

interface FeedbackListModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbacks: ApplicationFeedback[];
  isLoading?: boolean;
  onCreateFeedback: (title: string, description: string) => Promise<void>;
  isCreating?: boolean;
  canAddFeedback?: boolean;
}

export default function FeedbackListModal({
  isOpen,
  onClose,
  feedbacks,
  isLoading = false,
  onCreateFeedback,
  isCreating = false,
  canAddFeedback = true,
}: FeedbackListModalProps) {
  const t = useTranslations("recruiterModals");
  const tc = useTranslations("common");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleCreateFeedback = async (title: string, description: string) => {
    await onCreateFeedback(title, description);
    setIsAddModalOpen(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
        <div className="p-6 sm:p-8 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t("feedbackList.title")}
            </h2>
            {canAddFeedback && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                {t("feedbackList.addButton")}
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : feedbacks.length > 0 ? (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`rounded-lg p-4 border-s-4 ${getFeedbackCardColor(feedback)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      {feedback.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ms-4">
                      {formatDateTime(feedback.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
                    {feedback.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">
                      {feedback.created_by.first_name} {feedback.created_by.last_name}
                    </span>
                    {feedback.created_by.role && (
                      <>
                        <span>•</span>
                        <span>{feedback.created_by.role.name}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {t("feedbackList.empty")}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.close")}
          </Button>
        </div>
      </Modal>

      <FeedbackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateFeedback}
        isLoading={isCreating}
      />
    </>
  );
}

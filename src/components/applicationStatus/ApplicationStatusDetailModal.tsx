"use client";
import ApplicationStatusFormModal from "./ApplicationStatusFormModal";
import type { ApplicationStatus } from "@/types/applicationStatus";

interface ApplicationStatusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationStatus: ApplicationStatus | null;
  isLoading?: boolean;
}

export default function ApplicationStatusDetailModal({
  isOpen,
  onClose,
  applicationStatus,
  isLoading = false,
}: ApplicationStatusDetailModalProps) {
  return (
    <ApplicationStatusFormModal
      isOpen={isOpen}
      onClose={onClose}
      applicationStatus={applicationStatus}
      isLoading={isLoading}
      readOnly={true}
    />
  );
}

"use client";
import CompanyFormModal from "./CompanyFormModal";
import type { Company } from "@/types/company";

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  isLoading?: boolean;
}

export default function CompanyDetailModal({
  isOpen,
  onClose,
  company,
  isLoading = false,
}: CompanyDetailModalProps) {
  return (
    <CompanyFormModal
      isOpen={isOpen}
      onClose={onClose}
      company={company}
      isLoading={isLoading}
      readOnly={true}
    />
  );
}

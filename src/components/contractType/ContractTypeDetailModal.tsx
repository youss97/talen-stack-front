"use client";
import ContractTypeFormModal from "./ContractTypeFormModal";
import type { ContractType } from "@/types/contractType";

interface ContractTypeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractType: ContractType | null;
  isLoading?: boolean;
}

export default function ContractTypeDetailModal({
  isOpen,
  onClose,
  contractType,
  isLoading = false,
}: ContractTypeDetailModalProps) {
  return (
    <ContractTypeFormModal
      isOpen={isOpen}
      onClose={onClose}
      contractType={contractType}
      isLoading={isLoading}
      readOnly={true}
    />
  );
}

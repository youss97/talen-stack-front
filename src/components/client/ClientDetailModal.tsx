"use client";
import ClientFormModal from "./ClientFormModal";
import type { Client } from "@/types/client";

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  isLoading?: boolean;
}

export default function ClientDetailModal({
  isOpen,
  onClose,
  client,
  isLoading = false,
}: ClientDetailModalProps) {
  return (
    <ClientFormModal
      isOpen={isOpen}
      onClose={onClose}
      client={client}
      isLoading={isLoading}
      readOnly={true}
    />
  );
}

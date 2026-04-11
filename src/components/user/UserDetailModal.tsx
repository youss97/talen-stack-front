"use client";
import UserFormModal from "./UserFormModal";
import type { User } from "@/types/user";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isLoading?: boolean;
}

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  isLoading = false,
}: UserDetailModalProps) {
  return (
    <UserFormModal
      isOpen={isOpen}
      onClose={onClose}
      user={user}
      isLoading={isLoading}
      readOnly={true}
    />
  );
}

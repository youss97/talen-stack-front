"use client";
import { Pencil } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { useModal } from "../../hooks/useModal";
import type { RootState } from "@/lib/store";
import UpdateProfileModal from "./UpdateProfileModal";
import { getImageUrl } from "@/utils/imageHelper";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const user = useSelector((state: RootState) => state.auth.user);

  const fullName = user ? `${user.first_name} ${user.last_name}` : "Utilisateur";
  const photoUrl = getImageUrl(user?.photo_path) || null;

  if (!user) return null;

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* Avatar */}
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Photo de profil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `<div class="w-full h-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center"><span class="text-2xl font-semibold text-brand-600 dark:text-brand-400">${user.first_name?.charAt(0) || "U"}</span></div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
                    {user.first_name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>

            {/* Name / Position / Contact */}
            <div className="order-3 xl:order-2">
              <h4 className="mb-1 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {fullName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {user.position && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.position}</p>
                )}
                {user.position && user.phone && (
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                )}
                {user.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {user.email && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <Pencil size={18} strokeWidth={1.8} className="icon-glow" />
            Modifier
          </button>
        </div>
      </div>

      <UpdateProfileModal isOpen={isOpen} onClose={closeModal} user={user} />
    </>
  );
}

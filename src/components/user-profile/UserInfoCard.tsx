"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useUpdateProfileMutation } from "@/lib/services/userApi";
import type { RootState } from "@/lib/store";
import { Pencil } from "lucide-react";

// lucide-react n'inclut plus les logos de marque (LinkedIn, X, Facebook...) — icône dédiée.
function LinkedinIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.368-1.85 3.598 0 4.268 2.368 4.268 5.451v6.29zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.56V9h3.554v11.452z" />
    </svg>
  );
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const user = useSelector((state: RootState) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        bio: user.bio || "",
        facebook: user.facebook || "",
        twitter: user.twitter || "",
        linkedin: user.linkedin || "",
        instagram: user.instagram || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formDataToSend.append(key, value);
        }
      });
      await updateProfile(formDataToSend).unwrap();
      closeModal();
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const EditIcon = () => (
    <Pencil size={18} strokeWidth={1.8} className="icon-glow" />
  );

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
            Informations personnelles
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Prénom</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.first_name || "—"}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Nom</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.last_name || "—"}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.email || "—"}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Téléphone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.phone || "—"}</p>
            </div>

            {user?.bio && (
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Bio</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Social links */}
          {(user?.linkedin || user?.twitter || user?.facebook || user?.instagram) && (
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1">
                  <LinkedinIcon size={16} className="icon-glow" />
                  LinkedIn
                </a>
              )}
              {user.twitter && (
                <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-600">X.com</a>
              )}
              {user.facebook && (
                <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-600">Facebook</a>
              )}
              {user.instagram && (
                <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-600">Instagram</a>
              )}
            </div>
          )}
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <EditIcon />
          Modifier
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Informations personnelles
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Mettez à jour vos informations de contact
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Réseaux sociaux
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input type="text" name="facebook" value={formData.facebook} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>X.com</Label>
                    <Input type="text" name="twitter" value={formData.twitter} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" name="instagram" value={formData.instagram} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Informations personnelles
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Prénom</Label>
                    <Input type="text" name="first_name" value={formData.first_name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="text" value={user?.email || ""} disabled className="opacity-60 cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" name="bio" value={formData.bio} onChange={handleChange} placeholder="Quelques mots sur vous..." />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} type="button">Annuler</Button>
              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

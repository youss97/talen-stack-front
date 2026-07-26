"use client";
import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useUpdateProfileMutation } from "@/lib/services/userApi";
import type { RootState } from "@/lib/store";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const user = useSelector((state: RootState) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState({
    country: "",
    city: "",
    postal_code: "",
    tax_id: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        country: user.country || "",
        city: user.city || "",
        postal_code: user.postal_code || "",
        tax_id: user.tax_id || "",
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
    <Pencil className="icon-glow" size={18} strokeWidth={1.8} />
  );

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              Adresse & Localisation
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Pays</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.country || "—"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Ville</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.city || "—"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Code postal</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.postal_code || "—"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">N° fiscal (TAX ID)</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.tax_id || "—"}</p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <EditIcon />
            Modifier
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Adresse & Localisation
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Mettez à jour vos informations d'adresse
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Pays</Label>
                  <Input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Ex: Maroc" />
                </div>
                <div>
                  <Label>Ville</Label>
                  <Input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Casablanca" />
                </div>
                <div>
                  <Label>Code postal</Label>
                  <Input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Ex: 20000" />
                </div>
                <div>
                  <Label>N° fiscal (TAX ID)</Label>
                  <Input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} />
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
    </>
  );
}

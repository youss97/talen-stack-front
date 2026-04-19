"use client";
import { useEffect, useState, useRef } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  createCVSchema,
  updateCVSchema,
  type CreateCVFormData,
} from "@/validations/cvValidation";
import type { CV } from "@/types/cv";

interface CVFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  cv?: CV | null;
  isLoading?: boolean;
}

export default function CVFormModal({
  isOpen,
  onClose,
  onSubmit,
  cv,
  isLoading = false,
}: CVFormModalProps) {
  const isEditing = !!cv;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [mobilityInput, setMobilityInput] = useState("");
  const [contractInput, setContractInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCVFormData>({
    resolver: yupResolver(isEditing ? updateCVSchema : createCVSchema) as unknown as Resolver<CreateCVFormData>,
    defaultValues: {
      candidate_email: "",
      candidate_phone: "",
      candidate_first_name: "",
      candidate_last_name: "",
      total_experience: undefined,
      last_education: "",
      last_position: "",
      industry_experience: "",
      remote_preferred: false,
      status: undefined,
    },
  });

  useEffect(() => {
    if (cv) {
      reset({
        candidate_email: cv.candidate_email || "",
        candidate_phone: cv.candidate_phone || "",
        candidate_first_name: cv.candidate_first_name || "",
        candidate_last_name: cv.candidate_last_name || "",
        total_experience: cv.total_experience,
        last_education: cv.last_education || "",
        last_position: cv.last_position || "",
        industry_experience: cv.industry_experience || "",
        remote_preferred: cv.remote_preferred || false,
        status: cv.status || undefined,
      });
      setSkillsInput(cv.additional_skills?.join(", ") || "");
      setMobilityInput(cv.geographic_mobility?.join(", ") || "");
      setContractInput(cv.contract_type_preferences?.join(", ") || "");
    } else {
      reset({
        candidate_email: "",
        candidate_phone: "",
        candidate_first_name: "",
        candidate_last_name: "",
        total_experience: undefined,
        last_education: "",
        last_position: "",
        industry_experience: "",
        remote_preferred: false,
        status: undefined,
      });
      setSelectedFile(null);
      setSkillsInput("");
      setMobilityInput("");
      setContractInput("");
    }
  }, [cv, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("file", file);
    }
  };

  const handleFormSubmit = (data: CreateCVFormData) => {
    const formData = new FormData();

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    if (data.candidate_email) formData.append("candidate_email", data.candidate_email);
    if (data.candidate_phone) formData.append("candidate_phone", data.candidate_phone);
    if (data.candidate_first_name) formData.append("candidate_first_name", data.candidate_first_name);
    if (data.candidate_last_name) formData.append("candidate_last_name", data.candidate_last_name);
    if (data.total_experience !== undefined) formData.append("total_experience", String(data.total_experience));
    if (data.last_education) formData.append("last_education", data.last_education);
    if (data.last_position) formData.append("last_position", data.last_position);
    if (data.industry_experience) formData.append("industry_experience", data.industry_experience);
    if (data.remote_preferred !== undefined) formData.append("remote_preferred", String(data.remote_preferred));
    if (data.status) formData.append("status", data.status);

    if (skillsInput) {
      const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
      skills.forEach(skill => formData.append("additional_skills", skill));
    }

    if (mobilityInput) {
      const mobility = mobilityInput.split(",").map(s => s.trim()).filter(Boolean);
      mobility.forEach(m => formData.append("geographic_mobility", m));
    }

    if (contractInput) {
      const contracts = contractInput.split(",").map(s => s.trim()).filter(Boolean);
      contracts.forEach(c => formData.append("contract_type_preferences", c));
    }

    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? "Modifier le CV" : "Ajouter un CV"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing
            ? "Modifiez les informations du CV"
            : "Remplissez les informations pour créer un nouveau CV"}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5">
            {!isEditing && (
              <div>
                <Label>
                  Fichier CV (PDF) <span className="text-error-500">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-24 w-full rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-colors ${
                    errors.file
                      ? "border-error-500 bg-error-50 dark:bg-error-500/10"
                      : "border-gray-300 hover:border-brand-400 dark:border-gray-700"
                  }`}
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cliquez pour sélectionner un fichier PDF
                      </p>
                      <p className="text-xs text-gray-400">Max 10MB</p>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.file.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Jean"
                {...register("candidate_first_name")}
                error={!!errors.candidate_first_name}
                hint={errors.candidate_first_name?.message}
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                {...register("candidate_last_name")}
                error={!!errors.candidate_last_name}
                hint={errors.candidate_last_name?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="jean@example.com"
                {...register("candidate_email")}
                error={!!errors.candidate_email}
                hint={errors.candidate_email?.message}
              />
              <Input
                label="Téléphone"
                placeholder="+33 6 12 34 56 78"
                {...register("candidate_phone")}
                error={!!errors.candidate_phone}
                hint={errors.candidate_phone?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Poste actuel"
                placeholder="Développeur Full Stack"
                {...register("last_position")}
                error={!!errors.last_position}
                hint={errors.last_position?.message}
              />
              <Input
                label="Années d'expérience"
                type="number"
                placeholder="5"
                {...register("total_experience")}
                error={!!errors.total_experience}
                hint={errors.total_experience?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Formation"
                placeholder="Master Informatique"
                {...register("last_education")}
                error={!!errors.last_education}
                hint={errors.last_education?.message}
              />
              <Input
                label="Secteur d'activité"
                placeholder="IT / Tech"
                {...register("industry_experience")}
                error={!!errors.industry_experience}
                hint={errors.industry_experience?.message}
              />
            </div>

            <div>
              <Label>Compétences (séparées par des virgules)</Label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="React, Node.js, TypeScript"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <Label>Mobilité géographique (séparées par des virgules)</Label>
              <input
                type="text"
                value={mobilityInput}
                onChange={(e) => setMobilityInput(e.target.value)}
                placeholder="Paris, Lyon, Remote"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <Label>Types de contrat préférés (séparés par des virgules)</Label>
              <input
                type="text"
                value={contractInput}
                onChange={(e) => setContractInput(e.target.value)}
                placeholder="CDI, CDD, Freelance"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remote_preferred"
                {...register("remote_preferred")}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <Label htmlFor="remote_preferred">Préférence pour le télétravail</Label>
            </div>

            <div>
              <Label>Statut</Label>
              <select
                {...register("status")}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Sélectionner...</option>
                <option value="new">Nouveau</option>
                <option value="reviewed">Examiné</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>

          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button disabled={isLoading}>
            {isLoading
              ? "Enregistrement..."
              : isEditing
              ? "Modifier"
              : "Ajouter"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

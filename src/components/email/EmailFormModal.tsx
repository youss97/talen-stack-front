"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import CVInfiniteSelect from "@/components/form/CVInfiniteSelect";
import MultiInfiniteSelect from "@/components/form/MultiInfiniteSelect";
import { useSendEmailMutation } from "@/lib/services/emailApi";
import { useGetCVsForSelectInfiniteQuery } from "@/lib/services/cvApi";
import { useGetClientsForSelectInfiniteQuery } from "@/lib/services/clientApi";
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";
import { useGetClientManagersForSelectInfiniteQuery } from "@/lib/services/clientApi";
import { BulkEmailType, type SendEmailRequest } from "@/types/email";
import type { CV } from "@/types/cv";

interface EmailFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  subject: string;
  body: string;
  candidateIds: string[];
  clientEmails: string[];
  userEmails: string[];
  managerEmails: string[];
  selectedClientForManagers: string;
}

const EmailFormModal: React.FC<EmailFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sendEmail, { isLoading: isSending }] = useSendEmailMutation();
  const [selectedCVs, setSelectedCVs] = useState<CV[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      subject: "",
      body: "",
      candidateIds: [],
      clientEmails: [],
      userEmails: [],
      managerEmails: [],
      selectedClientForManagers: "",
    },
  });

  const candidateIds = watch("candidateIds");
  const clientEmails = watch("clientEmails");
  const userEmails = watch("userEmails");
  const managerEmails = watch("managerEmails");
  const selectedClientForManagers = watch("selectedClientForManagers");

  const onSubmit = async (data: FormData) => {
    try {
      const allRecipients: string[] = [];

      if (data.candidateIds.length > 0) {
        const candidateEmails = selectedCVs
          .filter(cv => cv.candidate_email)
          .map(cv => cv.candidate_email as string);
        allRecipients.push(...candidateEmails);
      }

      // Filter out placeholder values for clients without email
      allRecipients.push(...data.clientEmails.filter(v => v && !v.startsWith('no-email-')));
      allRecipients.push(...data.userEmails);
      allRecipients.push(...data.managerEmails);

      // Dédupliquer
      const uniqueRecipients = [...new Set(allRecipients)];

      if (uniqueRecipients.length === 0) {
        alert("Veuillez sélectionner au moins un destinataire avec un email valide");
        return;
      }

      const payload: SendEmailRequest = {
        subject: data.subject,
        body: data.body,
        type: BulkEmailType.MANUAL,
        recipients: uniqueRecipients,
      };

      await sendEmail(payload).unwrap();
      reset();
      setSelectedCVs([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedCVs([]);
    onClose();
  };

  const totalRecipients = candidateIds.length + clientEmails.length +
                          userEmails.length + managerEmails.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Envoyer un email
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sélectionnez les destinataires et composez votre message
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <div className="space-y-5">
            {/* Select Candidats */}
            <div>
              <Label htmlFor="candidateIds">Candidats</Label>
              <Controller
                name="candidateIds"
                control={control}
                render={({ field }) => (
                  <CVInfiniteSelect
                    value={field.value}
                    onChange={(value, selectedItems) => {
                      field.onChange(value);
                      if (Array.isArray(selectedItems)) {
                        setSelectedCVs(selectedItems);
                      } else if (selectedItems) {
                        setSelectedCVs([selectedItems]);
                      } else {
                        setSelectedCVs([]);
                      }
                    }}
                    useInfiniteQuery={useGetCVsForSelectInfiniteQuery}
                    placeholder="Rechercher des candidats..."
                    multiple
                  />
                )}
              />
            </div>

            {/* Select Clients */}
            <div>
              <Label htmlFor="clientEmails">Clients</Label>
              <Controller
                name="clientEmails"
                control={control}
                render={({ field }) => (
                  <MultiInfiniteSelect
                    useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                    value={field.value}
                    onChange={field.onChange}
                    getOptionLabel={(client: any) => {
                      const email = client.contact_email;
                      return email ? `${client.name} - ${email}` : `${client.name} (pas d'email)`;
                    }}
                    getOptionValue={(client: any) => client.contact_email || `no-email-${client.id}`}
                    placeholder="Rechercher des clients..."
                    multiple
                  />
                )}
              />
            </div>

            {/* Select Utilisateurs */}
            <div>
              <Label htmlFor="userEmails">Utilisateurs</Label>
              <Controller
                name="userEmails"
                control={control}
                render={({ field }) => (
                  <MultiInfiniteSelect
                    useInfiniteQuery={useGetUsersForSelectInfiniteQuery}
                    value={field.value}
                    onChange={field.onChange}
                    getOptionLabel={(user: any) => `${user.first_name} ${user.last_name} - ${user.email}`}
                    getOptionValue={(user: any) => user.email}
                    placeholder="Rechercher des utilisateurs..."
                    multiple
                  />
                )}
              />
            </div>

            {/* Select Managers */}
            <div>
              <Label htmlFor="managerEmails">Managers</Label>
              
              {/* Sélection du client d'abord */}
              <div className="mb-2">
                <MultiInfiniteSelect
                  useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                  value={selectedClientForManagers ? [selectedClientForManagers] : []}
                  onChange={(values) => {
                    setValue("selectedClientForManagers", values[0] || "");
                    setValue("managerEmails", []);
                  }}
                  getOptionLabel={(client: any) => client.name}
                  getOptionValue={(client: any) => client.id}
                  placeholder="Sélectionner un client d'abord..."
                  multiple={false}
                />
              </div>

              {/* Sélection des managers si un client est sélectionné */}
              {selectedClientForManagers && (
                <Controller
                  name="managerEmails"
                  control={control}
                  render={({ field }) => (
                    <MultiInfiniteSelect
                      useInfiniteQuery={useGetClientManagersForSelectInfiniteQuery}
                      queryArg={{ clientId: selectedClientForManagers }}
                      value={field.value}
                      onChange={field.onChange}
                      getOptionLabel={(manager: any) => `${manager.firstName} ${manager.lastName} - ${manager.email}`}
                      getOptionValue={(manager: any) => manager.email}
                      placeholder="Rechercher des managers..."
                      multiple
                    />
                  )}
                />
              )}
            </div>

            {/* Sujet */}
            <div>
              <Label htmlFor="subject">
                Sujet <span className="text-error-500">*</span>
              </Label>
              <Controller
                name="subject"
                control={control}
                rules={{ required: "Le sujet est requis" }}
                render={({ field }) => (
                  <InputField
                    {...field}
                    id="subject"
                    placeholder="Entrez le sujet de l'email"
                  />
                )}
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-error-500">{errors.subject.message}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="body">
                Message <span className="text-error-500">*</span>
              </Label>
              <Controller
                name="body"
                control={control}
                rules={{ required: "Le message est requis" }}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    placeholder="Entrez le contenu de l'email"
                    rows={8}
                  />
                )}
              />
              {errors.body && (
                <p className="mt-1 text-sm text-error-500">{errors.body.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSending || totalRecipients === 0}>
            {isSending ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmailFormModal;

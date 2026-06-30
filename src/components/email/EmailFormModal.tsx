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
import { useSendEmailMutation, useUpdateEmailMutation } from "@/lib/services/emailApi";
import { useGetCVsForSelectInfiniteQuery } from "@/lib/services/cvApi";
import { useGetClientsForSelectInfiniteQuery } from "@/lib/services/clientApi";
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";
import { useGetClientManagersForSelectInfiniteQuery } from "@/lib/services/clientApi";
import { BulkEmailType, type SendEmailRequest, type Email } from "@/types/email";
import type { CV } from "@/types/cv";

interface EmailFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Si fourni : mode édition d'un brouillon (même UI que l'ajout) */
  editingEmail?: Email | null;
}

interface FormData {
  subject: string;
  body: string;
  // À (To)
  candidateIds: string[];
  clientEmails: string[];
  userEmails: string[];
  managerEmails: string[];
  selectedClientForManagers: string;
  // CC
  ccCandidateIds: string[];
  ccClientEmails: string[];
  ccManagerEmails: string[];
  ccSelectedClientForManagers: string;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const EmailFormModal: React.FC<EmailFormModalProps> = ({ isOpen, onClose, onSuccess, editingEmail }) => {
  const [sendEmail, { isLoading: isSending }] = useSendEmailMutation();
  const [updateEmail, { isLoading: isUpdating }] = useUpdateEmailMutation();
  const isEditing = !!editingEmail;

  // À (To)
  const [selectedCVs, setSelectedCVs] = useState<CV[]>([]);
  // CC
  const [ccSelectedCVs, setCcSelectedCVs] = useState<CV[]>([]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // CC / BCC chip states (manual)
  const [manualRecipients, setManualRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");

  // Collapse CC / BCC sections
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);

  // Programmation de l'envoi
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(""); // valeur datetime-local
  // Mode de soumission choisi par le bouton cliqué
  const submitModeRef = React.useRef<"send" | "schedule" | "draft">("send");

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      subject: "",
      body: "",
      candidateIds: [],
      clientEmails: [],
      userEmails: [],
      managerEmails: [],
      selectedClientForManagers: "",
      ccCandidateIds: [],
      ccClientEmails: [],
      ccManagerEmails: [],
      ccSelectedClientForManagers: "",
    },
  });

  const candidateIds              = watch("candidateIds");
  const clientEmails              = watch("clientEmails");
  const userEmails                = watch("userEmails");
  const managerEmails             = watch("managerEmails");
  const selectedClientForManagers = watch("selectedClientForManagers");
  const ccCandidateIds            = watch("ccCandidateIds");
  const ccClientEmails            = watch("ccClientEmails");
  const ccManagerEmails           = watch("ccManagerEmails");
  const ccSelectedClientForManagers = watch("ccSelectedClientForManagers");

  // Mode édition : pré-remplir objet, contenu et destinataires (chips)
  React.useEffect(() => {
    if (editingEmail && isOpen) {
      setValue("subject", editingEmail.subject || "");
      setValue("body", editingEmail.body || "");
      const recips = Array.isArray(editingEmail.recipients)
        ? editingEmail.recipients
        : String(editingEmail.recipients || "").split(",").map((s) => s.trim()).filter(Boolean);
      setManualRecipients(recips);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEmail, isOpen]);

  const addChip = (
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    const parts = input.split(/[,;\s\n]+/).map(s => s.trim()).filter(Boolean);
    const valid = parts.filter(e => isValidEmail(e) && !list.includes(e));
    if (valid.length === 0) return;
    setList([...list, ...valid]);
    setInput("");
  };

  const removeChip = (email: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.filter(e => e !== email));

  const onSubmit = async (data: FormData) => {
    try {
      // Mode édition : on met simplement à jour le brouillon (même UI)
      if (isEditing && editingEmail) {
        const editTo: string[] = [
          ...manualRecipients,
          ...selectedCVs.filter((cv) => cv.candidate_email).map((cv) => cv.candidate_email as string),
          ...data.clientEmails.filter((v) => v && !v.startsWith("no-email-")),
          ...data.userEmails,
          ...data.managerEmails,
        ];
        setSubmitError(null);
        await updateEmail({
          id: editingEmail.id,
          subject: data.subject,
          body: data.body,
          recipients: [...new Set(editTo)],
        }).unwrap();
        setSubmitSuccess(true);
        handleClose();
        setTimeout(() => { setSubmitSuccess(false); onSuccess?.(); }, 500);
        return;
      }

      // Build To list
      const toRecipients: string[] = [...manualRecipients];
      if (data.candidateIds.length > 0) {
        toRecipients.push(...selectedCVs.filter(cv => cv.candidate_email).map(cv => cv.candidate_email as string));
      }
      toRecipients.push(...data.clientEmails.filter(v => v && !v.startsWith("no-email-")));
      toRecipients.push(...data.userEmails);
      toRecipients.push(...data.managerEmails);
      const uniqueRecipients = [...new Set(toRecipients)];

      // Build CC list
      const ccEmailList: string[] = [...ccRecipients];
      if (data.ccCandidateIds.length > 0) {
        ccEmailList.push(...ccSelectedCVs.filter(cv => cv.candidate_email).map(cv => cv.candidate_email as string));
      }
      ccEmailList.push(...data.ccClientEmails.filter(v => v && !v.startsWith("no-email-")));
      ccEmailList.push(...data.ccManagerEmails);
      const uniqueCC = [...new Set(ccEmailList)];

      const mode = submitModeRef.current;

      // Un brouillon peut être enregistré sans destinataire ; pas un envoi/programmation
      if (mode !== "draft" && uniqueRecipients.length === 0 && uniqueCC.length === 0 && bccRecipients.length === 0) {
        setSubmitError("Veuillez sélectionner au moins un destinataire.");
        return;
      }

      // En mode programmation : exiger une date future
      if (mode === "schedule") {
        if (!scheduledAt) {
          setSubmitError("Veuillez choisir une date et heure d'envoi.");
          return;
        }
        if (new Date(scheduledAt).getTime() <= Date.now()) {
          setSubmitError("La date d'envoi doit être dans le futur.");
          return;
        }
      }
      setSubmitError(null);

      const payload: SendEmailRequest = {
        subject: data.subject,
        body: data.body,
        type: BulkEmailType.MANUAL,
        recipients: uniqueRecipients,
        ...(uniqueCC.length > 0 && { cc: uniqueCC }),
        ...(bccRecipients.length > 0 && { bcc: bccRecipients }),
        ...(mode === "schedule" && { scheduled_at: new Date(scheduledAt).toISOString() }),
        ...(mode === "draft" && { is_draft: true }),
      };

      await sendEmail(payload).unwrap();
      setSubmitSuccess(true);
      handleClose();
      setTimeout(() => {
        setSubmitSuccess(false);
        onSuccess?.();
      }, 500);
    } catch (error: unknown) {
      const errData = (error as { data?: { message?: string | string[] } })?.data;
      let msg: string;
      if (Array.isArray(errData?.message)) msg = errData.message.join(". ");
      else if (errData?.message) msg = errData.message;
      else msg = "Erreur lors de l'envoi de l'email. Vérifiez les destinataires et réessayez.";
      setSubmitError(msg);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedCVs([]);
    setCcSelectedCVs([]);
    setManualRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setManualInput("");
    setCcInput("");
    setBccInput("");
    setSubmitError(null);
    setSubmitSuccess(false);
    setShowCC(false);
    setShowBCC(false);
    setShowSchedule(false);
    setScheduledAt("");
    submitModeRef.current = "send";
    onClose();
  };

  const totalTo = candidateIds.length + clientEmails.length + userEmails.length + managerEmails.length + manualRecipients.length;
  const totalCC = ccCandidateIds.length + ccClientEmails.length + ccManagerEmails.length + ccRecipients.length;

  // ── Shared sub-components ──────────────────────────────────

  const ChipList = ({ items, onRemove, colorClass = "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30" }: {
    items: string[];
    onRemove: (e: string) => void;
    colorClass?: string;
  }) =>
    items.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map(email => (
          <span key={email} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {email}
            <button type="button" onClick={() => onRemove(email)} className="ml-0.5 hover:opacity-70 text-sm leading-none">×</button>
          </span>
        ))}
      </div>
    ) : null;

  const EmailChipInput = ({ label, placeholder, inputValue, setInputValue, list, setList, colorClass }: {
    label: string;
    placeholder: string;
    inputValue: string;
    setInputValue: (v: string) => void;
    list: string[];
    setList: (v: string[]) => void;
    colorClass?: string;
  }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <InputField
            placeholder={placeholder}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === "," || e.key === ";") {
                e.preventDefault();
                addChip(inputValue, setInputValue, list, setList);
              }
            }}
            onPaste={e => {
              e.preventDefault();
              const pasted = e.clipboardData.getData("text");
              addChip(pasted, setInputValue, list, setList);
            }}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => addChip(inputValue, setInputValue, list, setList)}>
          Ajouter
        </Button>
      </div>
      <ChipList items={list} onRemove={e => removeChip(e, list, setList)} colorClass={colorClass} />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{isEditing ? "Modifier le brouillon" : "Envoyer un email"}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sélectionnez les destinataires et composez votre message
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        {submitError && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-lg bg-error-50 border border-error-200 dark:bg-error-500/10 dark:border-error-500/30 text-error-700 dark:text-error-400 text-sm">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-lg bg-success-50 border border-success-200 dark:bg-success-500/10 dark:border-success-500/30 text-success-700 dark:text-success-400 text-sm">
            Email envoyé avec succès !
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 custom-scrollbar">
          <div className="space-y-6">

            {/* ══ Section À (To) ══ */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  À
                </span>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Destinataires principaux</h3>
                {totalTo > 0 && (
                  <span className="text-xs text-gray-400">{totalTo} sélectionné{totalTo > 1 ? "s" : ""}</span>
                )}
              </div>

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
                        if (Array.isArray(selectedItems)) setSelectedCVs(selectedItems);
                        else if (selectedItems) setSelectedCVs([selectedItems]);
                        else setSelectedCVs([]);
                      }}
                      useInfiniteQuery={useGetCVsForSelectInfiniteQuery}
                      placeholder="Rechercher des candidats..."
                      multiple
                    />
                  )}
                />
              </div>

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
                        return email ? `${client.name} — ${email}` : `${client.name} (pas d'email)`;
                      }}
                      getOptionValue={(client: any) => client.contact_email || `no-email-${client.id}`}
                      placeholder="Rechercher des clients..."
                      multiple
                    />
                  )}
                />
              </div>

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
                      getOptionLabel={(user: any) => `${user.first_name} ${user.last_name} — ${user.email}`}
                      getOptionValue={(user: any) => user.email}
                      placeholder="Rechercher des utilisateurs..."
                      multiple
                    />
                  )}
                />
              </div>

              <div>
                <Label>Managers</Label>
                <div className="mb-2">
                  <MultiInfiniteSelect
                    useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                    value={selectedClientForManagers ? [selectedClientForManagers] : []}
                    onChange={values => {
                      setValue("selectedClientForManagers", values[0] || "");
                      setValue("managerEmails", []);
                    }}
                    getOptionLabel={(client: any) => client.name}
                    getOptionValue={(client: any) => client.id}
                    placeholder="Sélectionner un client d'abord..."
                    multiple={false}
                  />
                </div>
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
                        getOptionLabel={(manager: any) => `${manager.firstName} ${manager.lastName} — ${manager.email}`}
                        getOptionValue={(manager: any) => manager.email}
                        placeholder="Rechercher des managers..."
                        multiple
                      />
                    )}
                  />
                )}
              </div>

              <EmailChipInput
                label="Adresses email manuelles"
                placeholder="exemple@email.com, appuyez sur Entrée..."
                inputValue={manualInput}
                setInputValue={setManualInput}
                list={manualRecipients}
                setList={setManualRecipients}
              />
            </div>

            {/* ══ Section CC ══ */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setShowCC(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  CC
                </span>
                {showCC ? "Masquer la copie" : "Ajouter une copie (CC)"}
                {totalCC > 0 && !showCC && (
                  <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">{totalCC} sélectionné{totalCC > 1 ? "s" : ""}</span>
                )}
                <svg className={`w-4 h-4 transition-transform ${showCC ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCC && (
                <div className="mt-4 space-y-3 pl-3 border-l-2 border-blue-100 dark:border-blue-500/20">

                  <div>
                    <Label>Candidats (CC)</Label>
                    <Controller
                      name="ccCandidateIds"
                      control={control}
                      render={({ field }) => (
                        <CVInfiniteSelect
                          value={field.value}
                          onChange={(value, selectedItems) => {
                            field.onChange(value);
                            if (Array.isArray(selectedItems)) setCcSelectedCVs(selectedItems);
                            else if (selectedItems) setCcSelectedCVs([selectedItems]);
                            else setCcSelectedCVs([]);
                          }}
                          useInfiniteQuery={useGetCVsForSelectInfiniteQuery}
                          placeholder="Rechercher des candidats en copie..."
                          multiple
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Clients (CC)</Label>
                    <Controller
                      name="ccClientEmails"
                      control={control}
                      render={({ field }) => (
                        <MultiInfiniteSelect
                          useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                          value={field.value}
                          onChange={field.onChange}
                          getOptionLabel={(client: any) => {
                            const email = client.contact_email;
                            return email ? `${client.name} — ${email}` : `${client.name} (pas d'email)`;
                          }}
                          getOptionValue={(client: any) => client.contact_email || `no-email-${client.id}`}
                          placeholder="Rechercher des clients en copie..."
                          multiple
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Managers (CC)</Label>
                    <div className="mb-2">
                      <MultiInfiniteSelect
                        useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                        value={ccSelectedClientForManagers ? [ccSelectedClientForManagers] : []}
                        onChange={values => {
                          setValue("ccSelectedClientForManagers", values[0] || "");
                          setValue("ccManagerEmails", []);
                        }}
                        getOptionLabel={(client: any) => client.name}
                        getOptionValue={(client: any) => client.id}
                        placeholder="Sélectionner un client d'abord..."
                        multiple={false}
                      />
                    </div>
                    {ccSelectedClientForManagers && (
                      <Controller
                        name="ccManagerEmails"
                        control={control}
                        render={({ field }) => (
                          <MultiInfiniteSelect
                            useInfiniteQuery={useGetClientManagersForSelectInfiniteQuery}
                            queryArg={{ clientId: ccSelectedClientForManagers }}
                            value={field.value}
                            onChange={field.onChange}
                            getOptionLabel={(manager: any) => `${manager.firstName} ${manager.lastName} — ${manager.email}`}
                            getOptionValue={(manager: any) => manager.email}
                            placeholder="Rechercher des managers en copie..."
                            multiple
                          />
                        )}
                      />
                    )}
                  </div>

                  <EmailChipInput
                    label="Adresses CC manuelles"
                    placeholder="cc@email.com, appuyez sur Entrée..."
                    inputValue={ccInput}
                    setInputValue={setCcInput}
                    list={ccRecipients}
                    setList={setCcRecipients}
                    colorClass="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                  />
                </div>
              )}
            </div>

            {/* ══ Section CCI (BCC) ══ */}
            <div>
              <button
                type="button"
                onClick={() => setShowBCC(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  CCI
                </span>
                {showBCC ? "Masquer la copie cachée" : "Ajouter une copie cachée (CCI)"}
                {bccRecipients.length > 0 && !showBCC && (
                  <span className="ml-1 text-xs text-gray-500">{bccRecipients.length} sélectionné{bccRecipients.length > 1 ? "s" : ""}</span>
                )}
                <svg className={`w-4 h-4 transition-transform ${showBCC ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showBCC && (
                <div className="mt-3 pl-3 border-l-2 border-gray-100 dark:border-gray-700">
                  <EmailChipInput
                    label="Adresses CCI"
                    placeholder="cci@email.com, appuyez sur Entrée..."
                    inputValue={bccInput}
                    setInputValue={setBccInput}
                    list={bccRecipients}
                    setList={setBccRecipients}
                    colorClass="bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
            </div>

            {/* ══ Sujet ══ */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <Label htmlFor="subject">Sujet <span className="text-error-500">*</span></Label>
              <Controller
                name="subject"
                control={control}
                rules={{ required: "Le sujet est requis" }}
                render={({ field }) => (
                  <InputField {...field} id="subject" placeholder="Entrez le sujet de l'email" />
                )}
              />
              {errors.subject && <p className="mt-1 text-sm text-error-500">{errors.subject.message}</p>}
            </div>

            {/* ══ Message ══ */}
            <div>
              <Label htmlFor="body">Message <span className="text-error-500">*</span></Label>
              <Controller
                name="body"
                control={control}
                rules={{ required: "Le message est requis" }}
                render={({ field }) => (
                  <TextArea {...field} placeholder="Entrez le contenu de l'email" rows={8} />
                )}
              />
              {errors.body && <p className="mt-1 text-sm text-error-500">{errors.body.message}</p>}
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between border-t border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
            {totalTo > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-500" />
                {totalTo} destinataire{totalTo > 1 ? "s" : ""}
              </span>
            )}
            {totalCC > 0 && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                {totalCC} CC
              </span>
            )}
            {bccRecipients.length > 0 && (
              <span className="flex items-center gap-1 text-gray-500">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                {bccRecipients.length} CCI
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle programmation */}
            <button
              type="button"
              onClick={() => setShowSchedule(v => !v)}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
                showSchedule
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              🕐 {showSchedule ? "Programmation activée" : "Programmer l'envoi"}
            </button>
            {showSchedule && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
            )}

            <div className="flex-1" />

            <Button variant="outline" onClick={handleClose}>Annuler</Button>

            {isEditing ? (
              /* Mode édition : un seul bouton d'enregistrement */
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Enregistrement..." : "💾 Enregistrer les modifications"}
              </Button>
            ) : (
              <>
                {/* Brouillon */}
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => { submitModeRef.current = "draft"; }}
                >
                  💾 Brouillon
                </Button>

                {/* Programmer (si toggle activé) sinon Envoyer */}
                {showSchedule ? (
                  <Button
                    type="submit"
                    disabled={isSending || (totalTo === 0 && totalCC === 0 && bccRecipients.length === 0)}
                    onClick={() => { submitModeRef.current = "schedule"; }}
                  >
                    {isSending ? "..." : "📅 Programmer"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSending || (totalTo === 0 && totalCC === 0 && bccRecipients.length === 0)}
                    onClick={() => { submitModeRef.current = "send"; }}
                  >
                    {isSending ? "Envoi en cours..." : "Envoyer"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EmailFormModal;

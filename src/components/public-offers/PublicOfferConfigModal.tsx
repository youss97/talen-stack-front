"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useUpdateApplicationRequestMutation } from "@/lib/services/applicationRequestApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

// Champs configurables de l'offre publique (clés ↔ page /apply/[slug])
export const PUBLIC_OFFER_FIELDS: { key: string; label: string }[] = [
  { key: "description", label: "Description du poste" },
  { key: "required_skills", label: "Compétences requises" },
  { key: "location", label: "Lieu" },
  { key: "contract_type", label: "Type de contrat" },
  { key: "contract_duration", label: "Durée du contrat" },
  { key: "min_experience", label: "Expérience requise" },
  { key: "salary", label: "Salaire" },
  { key: "remote_possible", label: "Télétravail" },
  { key: "deadline", label: "Date limite" },
  { key: "desired_start_date", label: "Début souhaité" },
  { key: "reference", label: "Référence" },
  { key: "industry", label: "Secteur d'activité" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offerId: string | null;
  initialVisibleFields?: string[];
  onSaved?: () => void;
}

export default function PublicOfferConfigModal({ isOpen, onClose, offerId, initialVisibleFields, onSaved }: Props) {
  const [updateRequest, { isLoading }] = useUpdateApplicationRequestMutation();
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vide = tout afficher (rétro-compat)
    const all = !initialVisibleFields || initialVisibleFields.length === 0;
    const state: Record<string, boolean> = {};
    PUBLIC_OFFER_FIELDS.forEach((f) => {
      state[f.key] = all ? true : initialVisibleFields!.includes(f.key);
    });
    setVisible(state);
    setError(null);
  }, [initialVisibleFields, isOpen]);

  const toggle = (key: string) => setVisible((s) => ({ ...s, [key]: !s[key] }));
  const allChecked = PUBLIC_OFFER_FIELDS.every((f) => visible[f.key]);
  const setAll = (val: boolean) => {
    const state: Record<string, boolean> = {};
    PUBLIC_OFFER_FIELDS.forEach((f) => { state[f.key] = val; });
    setVisible(state);
  };

  const handleSave = async () => {
    if (!offerId) return;
    const selected = PUBLIC_OFFER_FIELDS.filter((f) => visible[f.key]).map((f) => f.key);
    // Si tout est coché → [] (= tout afficher)
    const payload = selected.length === PUBLIC_OFFER_FIELDS.length ? [] : selected;
    try {
      await updateRequest({ id: offerId, data: { public_visible_fields: payload } as never }).unwrap();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors de l'enregistrement de la configuration"));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex-shrink-0 p-6 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Configurer l&apos;offre publique</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sélectionnez les champs à afficher sur la page publique de l&apos;offre. Le titre, l&apos;entreprise et le formulaire de candidature sont toujours visibles.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </div>
        )}
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          La couleur de vos offres publiques est définie une seule fois dans <span className="font-medium">Paramètres → Site public &amp; branding</span> et s&apos;applique à toutes vos offres.
        </p>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Champs affichés</span>
          <button
            type="button"
            onClick={() => setAll(!allChecked)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {allChecked ? "Tout désélectionner" : "Sélectionner tout"}
          </button>
        </div>
        <ul className="space-y-2">
          {PUBLIC_OFFER_FIELDS.map((f) => (
            <li key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
              <span className="text-sm text-gray-800 dark:text-gray-200">{f.label}</span>
              <button
                type="button"
                onClick={() => toggle(f.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${visible[f.key] ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
                aria-label={visible[f.key] ? "Visible" : "Masqué"}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${visible[f.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
        <Button onClick={handleSave} disabled={isLoading || !offerId}>
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </Modal>
  );
}

"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useGetCrmCompanyByIdQuery, useCreateCrmContactMutation } from "@/lib/services/crmApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

interface Props {
  crmCompanyId?: string;
  value: string[];
  onChange: (ids: string[]) => void;
}

const EMPTY = { first_name: "", last_name: "", position: "", email: "", phone: "" };

// Sélection de plusieurs contacts du prospect pour une opportunité, avec création à la volée
export default function CrmDealContactsPicker({ crmCompanyId, value, onChange }: Props) {
  const t = useTranslations("crm.deals.form.contacts");
  const { data: company } = useGetCrmCompanyByIdQuery(crmCompanyId || "", { skip: !crmCompanyId });
  const [createContact, { isLoading }] = useCreateCrmContactMutation();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const contacts = company?.contacts || [];

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const handleCreate = async () => {
    if (!crmCompanyId) return;
    if (!draft.first_name.trim() || !draft.last_name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setError(null);
    try {
      const created = await createContact({
        crmCompanyId,
        data: {
          first_name: draft.first_name.trim(),
          last_name: draft.last_name.trim(),
          position: draft.position.trim() || undefined,
          email: draft.email.trim() || undefined,
          phone: draft.phone.trim() || undefined,
        },
      }).unwrap();
      onChange([...value, created.id]);
      setDraft(EMPTY);
      setAdding(false);
    } catch (err) {
      setError(getApiErrorMessage(err, t("createError")));
    }
  };

  if (!crmCompanyId) {
    return (
      <div>
        <Label>{t("label")}</Label>
        <p className="text-xs text-gray-400">{t("selectCompanyFirst")}</p>
      </div>
    );
  }

  return (
    <div>
      <Label>{t("label")}</Label>
      {contacts.length === 0 && !adding && <p className="mb-2 text-xs text-gray-400">{t("none")}</p>}
      <div className="space-y-2">
        {contacts.map((c) => (
          <label
            key={c.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <input type="checkbox" checked={value.includes(c.id)} onChange={() => toggle(c.id)} className="mt-1 w-4 h-4" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {c.first_name} {c.last_name}
                {c.position ? <span className="font-normal text-gray-500"> · {c.position}</span> : null}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {[c.email, c.phone].filter(Boolean).join(" · ") || "-"}
              </p>
            </div>
          </label>
        ))}
      </div>

      {adding ? (
        <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("lastName")} <span className="text-error-500">*</span></Label>
              <Input value={draft.last_name} onChange={(e) => setDraft((d) => ({ ...d, last_name: e.target.value }))} />
            </div>
            <div>
              <Label>{t("firstName")} <span className="text-error-500">*</span></Label>
              <Input value={draft.first_name} onChange={(e) => setDraft((d) => ({ ...d, first_name: e.target.value }))} />
            </div>
            <div>
              <Label>{t("email")}</Label>
              <Input type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
            </div>
            <div>
              <Label>{t("phone")}</Label>
              <Input type="tel" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>{t("position")}</Label>
              <Input value={draft.position} onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-xs text-error-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAdding(false); setDraft(EMPTY); setError(null); }} disabled={isLoading}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? t("saving") : t("save")}</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <Plus size={15} strokeWidth={1.8} /> {t("add")}
        </button>
      )}
    </div>
  );
}

"use client";
import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone, MapPin, Calendar, User, MessageSquare, HelpCircle, FileText, Download, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import type { PublicApplication } from "@/types/publicJobOffer";
import { formatDateTime } from "@/utils/dateFormat";

interface PublicApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: PublicApplication | null;
  onDownloadCv?: (application: PublicApplication) => void;
}

export default function PublicApplicationDetailModal({
  isOpen,
  onClose,
  application,
  onDownloadCv,
}: PublicApplicationDetailModalProps) {
  const t = useTranslations("publicOffers.applications.detailModal");
  if (!application) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          {application.first_name} {application.last_name}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          {t("receivedOn", { date: formatDateTime(application.created_at) })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <Section title={t("contact")} icon={User}>
          <div className="flex flex-wrap gap-2">
            <InfoChip icon={Mail} text={application.email} />
            {application.phone && <InfoChip icon={Phone} text={application.phone} />}
            {application.city && <InfoChip icon={MapPin} text={application.city} />}
            <InfoChip icon={Calendar} text={formatDateTime(application.created_at)} />
            {application.referrer && (
              <InfoChip icon={Link2} text={`${application.referrer.first_name} ${application.referrer.last_name}`} />
            )}
          </div>
        </Section>

        {application.message && (
          <Section title={t("motivationLetter")} icon={MessageSquare}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text)" }}>
              {application.message}
            </p>
          </Section>
        )}

        {application.answers && application.answers.length > 0 && (
          <Section title={t("customAnswers")} icon={HelpCircle}>
            <div className="space-y-3">
              {application.answers.map((a) => (
                <div key={a.id}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>{a.question_text}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {a.answer_value === "yes" ? t("yes") : a.answer_value === "no" ? t("no") : a.answer_value}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {application.cv_path && (
          <Section title={t("cv")} icon={FileText}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadCv?.(application)}
              startIcon={<Download className="icon-glow" size={16} strokeWidth={1.8} />}
            >
              {t("downloadCv")}
            </Button>
          </Section>
        )}
      </div>

      <div className="flex-shrink-0 flex justify-end p-4 sm:p-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <Button variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </Modal>
  );
}

/** Carte de section : titre avec pastille icône (monochrome) + contenu aéré — même pattern que CVDetailModal. */
function Section({ title, icon: Icon, children }: { title: React.ReactNode; icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }>; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--ds-shadow-card)" }}
    >
      <h3 className="flex items-center gap-2.5 mb-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--surface-2)" }}>
          <Icon size={16} strokeWidth={1.8} className="icon-glow" style={{ color: "var(--text-2)" }} />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoChip({ icon: Icon, text }: { icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
    >
      <Icon size={13} strokeWidth={1.8} className="icon-glow" />
      <span style={{ color: "var(--text)" }}>{text}</span>
    </span>
  );
}

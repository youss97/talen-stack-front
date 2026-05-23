"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  useGetPublicJobOfferBySlugQuery,
  useSubmitPublicApplicationMutation,
} from "@/lib/services/publicJobOfferApi";
import { formatDate } from "@/utils/dateFormat";

const ThreeParticles = dynamic(() => import("@/components/common/ThreeParticles"), { ssr: false });

const BRAND    = "#8AB925";
const BRAND_DK = "#1c2906";
const BRAND_LT = "#f5fae8";
const BRAND_TX = "#5c7d17";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const inputCls =
  "w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8AB925]/30 focus:border-[#8AB925] transition-colors";

/* ── Modal de candidature ── */
function ApplyModal({
  offer,
  onClose,
  onSuccess,
}: {
  offer: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitApplication, { isLoading: isSubmitting }] = useSubmitPublicApplicationMutation();
  const [formData, setFormData] = useState({ first_name: "", last_name: "", email: "", phone: "", message: "" });
  const [cvFile, setCvFile]   = useState<File | null>(null);
  const [error,  setError]    = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!ok.includes(file.type)) { setError("PDF, DOC ou DOCX uniquement"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Fichier trop lourd (max 5 MB)"); return; }
    setCvFile(file);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      setError("Veuillez remplir tous les champs obligatoires"); return;
    }
    if (!cvFile) { setError("Veuillez joindre votre CV"); return; }
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    fd.append("cv_file", cvFile);
    fd.append("source", "direct");
    try {
      await submitApplication({ slug: offer.public_slug, data: fd }).unwrap();
      onSuccess();
    } catch (err: any) {
      setError(err?.data?.message || "Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Modal header */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-8 py-5 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Postuler</h3>
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{offer.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input type="text" name="first_name" value={formData.first_name}
                  onChange={handleChange} placeholder="Jean" required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input type="text" name="last_name" value={formData.last_name}
                  onChange={handleChange} placeholder="Dupont" required className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="jean@exemple.com" required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="+212 6 00 00 00 00" required className={inputCls} />
              </div>
            </div>

            {/* CV drop zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CV (PDF, DOC, DOCX — max 5 MB) <span className="text-red-500">*</span>
              </label>
              <label
                className="relative flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                style={{ borderColor: cvFile ? BRAND : "#e5e7eb", background: cvFile ? BRAND_LT : "#fafafa" }}
              >
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFile}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                {cvFile ? (
                  <>
                    <svg className="w-6 h-6 mb-1" style={{ color: BRAND }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: BRAND_TX }}>{cvFile.name}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{(cvFile.size / 1024).toFixed(0)} KB</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500">Glisser ou cliquer pour déposer votre CV</span>
                  </>
                )}
              </label>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lettre de motivation <span className="text-xs text-gray-400">(optionnel)</span>
              </label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows={4}
                placeholder="Parlez-nous de vous et de votre motivation pour ce poste…"
                className={`${inputCls} h-auto resize-none`} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_TX})` }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Envoyer ma candidature
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════ */
export default function PublicApplyPage() {
  const params = useParams();
  const slug   = params.slug as string;

  const { data: offer, isLoading, error } = useGetPublicJobOfferBySlugQuery(slug);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  // Société RH = offer.client?.company (la firme de recrutement)
  const rhCompany  = offer?.client?.company;
  const rhName = rhCompany?.name ?? offer?.company?.name ?? offer?.company_name ?? "";

  /* ── Loading ── */
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND_LT }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 animate-spin"
          style={{ borderColor: `${BRAND}44`, borderTopColor: BRAND }} />
        <p className="text-sm font-medium" style={{ color: BRAND_TX }}>Chargement de l'offre…</p>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (error || !offer) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md mx-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Offre introuvable</h1>
        <p className="text-gray-500">Cette offre n'existe pas ou n'est plus disponible.</p>
      </div>
    </div>
  );

  const infoGrid = [
    offer.reference         && { icon:"🔖", label:"Référence",       value: offer.reference },
    offer.contract_type     && { icon:"📋", label:"Contrat",         value: offer.contract_type },
    offer.location          && { icon:"📍", label:"Lieu",            value: offer.location },
    offer.min_experience    && { icon:"🎯", label:"Expérience",      value: `${offer.min_experience} an(s) min.` },
    (offer.min_salary || offer.max_salary) && {
      icon:"💰", label:"Salaire",
      value: offer.min_salary && offer.max_salary
        ? `${offer.min_salary} – ${offer.max_salary}`
        : offer.min_salary ? `À partir de ${offer.min_salary}` : `Jusqu'à ${offer.max_salary}`,
    },
    offer.contract_duration && { icon:"⏱",  label:"Durée",          value: offer.contract_duration },
    offer.remote_possible !== undefined && {
      icon:"🏠", label:"Télétravail", value: offer.remote_possible ? "Possible" : "Non",
    },
    offer.deadline && { icon:"⏳", label:"Date limite",
      value: formatDate(offer.deadline, { day:"numeric", month:"long", year:"numeric" }) },
    offer.desired_start_date && { icon:"🚀", label:"Début souhaité",
      value: formatDate(offer.desired_start_date, { day:"numeric", month:"long", year:"numeric" }) },
    offer.client?.industry  && { icon:"🏭", label:"Secteur",         value: offer.client.industry },
  ].filter(Boolean) as { icon:string; label:string; value:string }[];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Modal ── */}
      {modalOpen && !submitted && (
        <ApplyModal
          offer={offer}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); setSubmitted(true); }}
        />
      )}

      {/* ── Hero avec Three.js ── */}
      <div className="relative overflow-hidden" style={{ background: BRAND_DK, minHeight: 300 }}>
        <ThreeParticles color={BRAND} count={60} opacity={0.55} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${BRAND}22 0%, transparent 70%)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: BRAND }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold tracking-wider"
            style={{ background: `${BRAND}22`, color: BRAND, border: `1px solid ${BRAND}44` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND }} />
            OFFRE EN COURS
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight"
          >
            {offer.title}
          </motion.h1>

          {offer.client?.name && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg font-medium mb-6" style={{ color: `${BRAND}cc` }}>
              {offer.client.name}
            </motion.p>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
          >
            {offer.location && (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/80 bg-white/10 border border-white/10 backdrop-blur-sm">
                📍 {offer.location}
              </span>
            )}
            {offer.contract_type && (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/80 bg-white/10 border border-white/10 backdrop-blur-sm">
                📋 {offer.contract_type}
              </span>
            )}
            {offer.min_experience && (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/80 bg-white/10 border border-white/10 backdrop-blur-sm">
                🎯 {offer.min_experience} an(s) exp.
              </span>
            )}
          </motion.div>

          {/* CTA principal dans le hero */}
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_TX})` }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Postuler à cette offre
          </motion.button>
        </div>
      </div>

      {/* ── Success banner ── */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-6"
        >
          <div className="flex items-center gap-4 p-5 rounded-2xl border"
            style={{ background: BRAND_LT, borderColor: `${BRAND}44` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: BRAND }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: BRAND_TX }}>Candidature envoyée avec succès !</p>
              <p className="text-xs mt-0.5" style={{ color: BRAND_TX }}>
                Notre équipe RH vous recontactera dans les meilleurs délais.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
                Description du poste
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-7 text-[15px]">
                {offer.description}
              </p>
            </motion.div>

            {/* Compétences */}
            {offer.required_skills && offer.required_skills.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
                  Compétences requises
                </h2>
                <div className="flex flex-wrap gap-2">
                  {offer.required_skills.map((skill: string, i: number) => (
                    <motion.span key={i}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: BRAND_LT, color: BRAND_TX }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA card mobile */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <p className="text-sm text-gray-500 mb-4">Intéressé(e) par ce poste ?</p>
              <button onClick={() => setModalOpen(true)}
                className="w-full h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_TX})` }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Postuler maintenant
              </button>
            </motion.div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.5}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full" style={{ background: BRAND }} />
                Détails du poste
              </h3>

              <div className="space-y-3">
                {infoGrid.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA sidebar */}
              <button onClick={() => setModalOpen(true)}
                className="mt-5 w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_TX})` }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Postuler maintenant
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center text-sm text-gray-400">
          {rhName ? (
            <p>© {new Date().getFullYear()} {rhName}. Tous droits réservés.</p>
          ) : (
            <p>© {new Date().getFullYear()}. Tous droits réservés.</p>
          )}
        </div>
      </footer>
    </div>
  );
}

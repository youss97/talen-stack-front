"use client";
import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useGetPublicJobOfferBySlugQuery,
  useSubmitPublicApplicationMutation,
} from "@/lib/services/publicJobOfferApi";

const ThreeParticles = dynamic(() => import("@/components/common/ThreeParticles"), { ssr: false });

const BRAND = "#8AB925";
const BRAND_DARK = "#1c2906";
const BRAND_LT = "#f5fae8";
const BRAND_TX = "#5c7d17";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const inputClass =
  "w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8AB925]/30 focus:border-[#8AB925] transition-colors";

export default function PublicJobPage() {
  const t = useTranslations("public.jobs");
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const source = searchParams.get("source") || "direct";

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: offer, isLoading, error } = useGetPublicJobOfferBySlugQuery(slug);
  const [submitApplication, { isLoading: isSubmitting }] = useSubmitPublicApplicationMutation();

  const addToast = (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("error", t("form.errors.fileTooLargeTitle"), t("form.errors.fileTooLargeMessage"));
      return;
    }
    setCvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      addToast("error", t("form.errors.errorTitle"), t("form.errors.requiredFields"));
      return;
    }
    const fd = new FormData();
    fd.append("first_name", formData.first_name);
    fd.append("last_name", formData.last_name);
    fd.append("email", formData.email);
    fd.append("phone", formData.phone);
    fd.append("message", formData.message);
    fd.append("source", source);
    if (cvFile) fd.append("cv", cvFile);
    try {
      await submitApplication({ slug, data: fd }).unwrap();
      setSubmitted(true);
    } catch {
      addToast("error", t("form.errors.errorTitle"), t("form.errors.submitFailed"));
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5fae8]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-[#8AB925]/30 border-t-[#8AB925] animate-spin"
          />
          <p className="text-sm text-[#5c7d17] font-medium">{t("loading")}</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (error || !offer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5fae8]">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t("notFound.title")}</h1>
          <p className="text-gray-500">{t("notFound.message")}</p>
        </div>
      </div>
    );
  }

  const clientName = offer.client?.name ?? "";

  const infoItems = [
    offer.contract_type && { icon: "📋", label: t("info.contract"), value: offer.contract_type },
    offer.location && { icon: "📍", label: t("info.location"), value: offer.location },
    offer.salary && { icon: "💰", label: t("info.salary"), value: offer.salary },
    offer.experience_required && { icon: "🎯", label: t("info.experience"), value: offer.experience_required },
    offer.deadline && !isNaN(new Date(offer.deadline).getTime()) && {
      icon: "⏳",
      label: t("info.deadline"),
      value: new Date(offer.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Top nav bar ── */}
      {clientName && (
        <div className="bg-white/90 backdrop-blur border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <span className="text-lg font-bold" style={{ color: BRAND }}>
              {clientName}
            </span>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: BRAND_DARK, minHeight: 320 }}>
        {/* Three.js particles */}
        <ThreeParticles color={BRAND} count={60} opacity={0.55} />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${BRAND}22 0%, transparent 70%)`,
          }}
        />

        {/* Accent stripe bottom */}
        <div className="absolute bottom-0 start-0 end-0 h-1" style={{ background: BRAND }} />

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-wider"
            style={{ background: `${BRAND}22`, color: BRAND, border: `1px solid ${BRAND}44` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND }} />
            {t("badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight"
          >
            {offer.title}
          </motion.h1>

          {clientName && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg font-medium mb-6"
              style={{ color: `${BRAND}cc` }}
            >
              {clientName}
            </motion.p>
          )}

          {/* Chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
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
            {offer.experience_required && (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/80 bg-white/10 border border-white/10 backdrop-blur-sm">
                🎯 {offer.experience_required}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
                {t("sections.about")}
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-7 text-[15px]">
                {offer.description}
              </p>
            </motion.div>

            {/* Skills */}
            {offer.skills && offer.skills.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
                  {t("sections.skills")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {offer.skills.map((skill: string, i: number) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
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

            {/* Application form */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
            >
              {!submitted ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
                    {t("sections.apply")}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t("form.firstName")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder={t("form.firstNamePlaceholder")}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t("form.lastName")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder={t("form.lastNamePlaceholder")}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t("form.email")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t("form.emailPlaceholder")}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t("form.phone")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={t("form.phonePlaceholder")}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* CV upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t("form.cv")}
                      </label>
                      <label
                        className="relative flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                        style={{
                          borderColor: cvFile ? BRAND : "#e5e7eb",
                          background: cvFile ? BRAND_LT : "#fafafa",
                        }}
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        {cvFile ? (
                          <>
                            <svg className="w-6 h-6 mb-1" style={{ color: BRAND }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium" style={{ color: BRAND_TX }}>{cvFile.name}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{(cvFile.size / 1024).toFixed(0)} KB</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm text-gray-500">{t("form.cvDropIdle")}</span>
                          </>
                        )}
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t("form.message")}
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder={t("form.messagePlaceholder")}
                        className={`${inputClass} h-auto resize-none`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_TX})` }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t("form.submitting")}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          {t("form.submit")}
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ background: BRAND_LT }}
                  >
                    <svg className="w-10 h-10" style={{ color: BRAND }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("success.title")}</h2>
                  <p className="text-gray-500 text-[15px] max-w-sm mx-auto leading-relaxed">
                    {t("success.message")}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">
            {/* Info card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.5}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24"
            >
              <h3 className="font-bold text-gray-900 mb-5 text-base flex items-center gap-2">
                <span className="w-1 h-4 rounded-full" style={{ background: BRAND }} />
                {t("details")}
              </h3>

              <div className="space-y-4">
                {infoItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Apply CTA shortcut */}
              {!submitted && (
                <button
                  onClick={() => document.querySelector("form")?.scrollIntoView({ behavior: "smooth" })}
                  className="mt-6 w-full h-10 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: BRAND_LT, color: BRAND_TX }}
                >
                  {t("applyShortcut")}
                </button>
              )}
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-center text-sm text-gray-400">
          <p>
            {clientName
              ? t("footer.rightsWithName", { year: new Date().getFullYear(), name: clientName })
              : t("footer.rightsNoName", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}

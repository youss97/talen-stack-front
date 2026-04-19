"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useGetPublicJobOfferBySlugQuery,
  useSubmitPublicApplicationMutation,
} from "@/lib/services/publicJobOfferApi";

export default function PublicJobPage() {
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

  const addToast = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast("error", "Fichier trop volumineux", "Le CV ne doit pas dépasser 5 MB");
        return;
      }
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      addToast("error", "Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("first_name", formData.first_name);
    formDataToSend.append("last_name", formData.last_name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("message", formData.message);
    formDataToSend.append("source", source);
    
    if (cvFile) {
      formDataToSend.append("cv", cvFile);
    }

    try {
      await submitApplication({ slug, data: formDataToSend }).unwrap();
      setSubmitted(true);
      addToast("success", "Candidature envoyée", "Votre candidature a été envoyée avec succès");
    } catch (error) {
      addToast("error", "Erreur", "Erreur lors de l'envoi de la candidature");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Offre non trouvée
          </h1>
          <p className="text-gray-600">
            Cette offre n'existe pas ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  const brandColor = offer.public_brand_color || "#3B82F6";

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header avec logo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {offer.company?.logo ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${offer.company.logo}`}
              alt={offer.company_name}
              className="h-12 object-contain"
            />
          ) : (
            <div className="text-xl font-bold" style={{ color: brandColor }}>
              {offer.company_name}
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="relative py-16 px-4"
        style={{ backgroundColor: brandColor }}
      >
        <div className="max-w-5xl mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">{offer.title}</h1>
          <p className="text-xl">
            {offer.location}
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                À propos du poste
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {offer.description}
              </p>
            </div>

            {offer.skills && offer.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Compétences requises
                </h2>
                <div className="flex flex-wrap gap-2">
                  {offer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${brandColor}20`,
                        color: brandColor,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire de candidature */}
            {!submitted ? (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Postuler à cette offre
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CV (PDF, DOC, DOCX - Max 5MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                    />
                    {cvFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Fichier sélectionné: {cvFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message de motivation
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Parlez-nous de vous et de votre motivation..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}20` }}
                >
                  <svg
                    className="w-8 h-8"
                    style={{ color: brandColor }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Candidature envoyée !
                </h2>
                <p className="text-gray-600">
                  Merci pour votre candidature. Nous reviendrons vers vous rapidement.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Informations</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type de contrat</p>
                  <p className="text-sm font-medium text-gray-900">
                    {offer.contract_type}
                  </p>
                </div>

                {offer.salary && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Salaire</p>
                    <p className="text-sm font-medium text-gray-900">
                      {offer.salary}
                    </p>
                  </div>
                )}

                {offer.experience_required && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expérience</p>
                    <p className="text-sm font-medium text-gray-900">
                      {offer.experience_required}
                    </p>
                  </div>
                )}

                {offer.deadline && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date limite</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(offer.deadline).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {offer.company?.logo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${offer.company.logo}`}
                  alt={offer.company_name}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} {offer.company_name}. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}

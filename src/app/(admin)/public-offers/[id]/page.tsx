"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import {
  useGetPublicJobOfferByIdQuery,
  useGetPublicApplicationsByRequestQuery,
  useConvertPublicApplicationMutation,
} from "@/lib/services/publicJobOfferApi";
import ApplicationsList from "@/components/public-offers/ApplicationsList";
import ConversionLoader from "@/components/public-offers/ConversionLoader";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function PublicOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const { data: offer, isLoading } = useGetPublicJobOfferByIdQuery(id);
  const { data: publicApps = [] } = useGetPublicApplicationsByRequestQuery(id, { skip: !id });
  const [convertPublicApp] = useConvertPublicApplicationMutation();
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertDone, setConvertDone] = useState(false);

  const handleConvert = async (appId: string) => {
    setConvertingId(appId);
    setConvertDone(false);
    try {
      await convertPublicApp({ id: appId, requestId: id }).unwrap();
      // Afficher brièvement les étapes validées avant de fermer l'overlay
      setConvertDone(true);
      await new Promise((r) => setTimeout(r, 900));
      addToast("success", "Transformée", "Candidat ajouté au vivier et candidature créée.");
    } catch (e) {
      addToast("error", "Erreur", getApiErrorMessage(e, "Échec de la transformation"));
    } finally {
      setConvertingId(null);
      setConvertDone(false);
    }
  };

  const publicUrl = offer?.public_slug && typeof window !== "undefined"
    ? `${window.location.origin}/apply/${offer.public_slug}`
    : "";

  const addToast = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    addToast("success", "Lien copié", "Le lien a été copié dans le presse-papier");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!offer || !offer.is_public) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Offre non trouvée ou non publique</p>
          <Button onClick={() => router.push("/public-offers")} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConversionLoader active={!!convertingId} done={convertDone} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {offer.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {offer.client?.name || 'N/A'} • {offer.location}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/public-offers")}>
          Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de l'offre */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Détails de l'offre
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge color="success" variant="light">
                  Publique
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {offer.contract_type}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {offer.description}
                </p>
              </div>

              {(offer.min_salary || offer.max_salary) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Salaire
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {offer.min_salary && offer.max_salary 
                      ? `${offer.min_salary}€ - ${offer.max_salary}€`
                      : offer.min_salary 
                        ? `À partir de ${offer.min_salary}€`
                        : `Jusqu'à ${offer.max_salary}€`
                    }
                  </p>
                </div>
              )}

              {offer.min_experience && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expérience requise
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {offer.min_experience} ans minimum
                  </p>
                </div>
              )}

              {offer.required_skills && offer.required_skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compétences requises
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {offer.required_skills.map((skill: unknown, index: number) => {
                      const label = typeof skill === "string" ? skill : (skill as { name?: string })?.name;
                      if (!label) return null;
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {offer.deadline && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date limite
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {offer.deadline && !isNaN(new Date(offer.deadline).getTime())
                      ? new Date(offer.deadline).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistiques
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {offer.public_views_count || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Vues
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {offer.published_at && !isNaN(new Date(offer.published_at).getTime())
                    ? new Date(offer.published_at).toLocaleDateString('fr-FR')
                    : 'N/A'
                  }
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Date de publication
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Lien public */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lien public
            </h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg break-all text-sm text-gray-700 dark:text-gray-300">
                {publicUrl}
              </div>
              
              <Button onClick={copyLink} variant="outline" className="w-full">
                Copier le lien
              </Button>
              
              <Button
                onClick={() => window.open(publicUrl, "_blank")}
                variant="outline"
                className="w-full"
              >
                Prévisualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidatures de l'offre publique (séparées des candidatures) */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Candidatures reçues (offre publique)
            <span className="ml-2 text-sm text-gray-400">({publicApps.length})</span>
          </h2>
        </div>
        <ApplicationsList
          applications={publicApps}
          onConvert={handleConvert}
          convertingId={convertingId}
        />
      </div>
    </div>
  );
}

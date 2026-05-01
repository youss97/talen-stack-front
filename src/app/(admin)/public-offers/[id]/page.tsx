"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { useGetPublicJobOfferByIdQuery } from "@/lib/services/publicJobOfferApi";

export default function PublicOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const { data: offer, isLoading } = useGetPublicJobOfferByIdQuery(id);

  const publicUrl = offer?.public_slug 
    ? `${window.location.origin}/apply/${offer.public_slug}` 
    : "";

  useEffect(() => {
    if (offer?.public_slug && canvasRef.current) {
      const url = `${window.location.origin}/apply/${offer.public_slug}`;
      setQrCodeUrl(url);
      
      QRCode.toCanvas(canvasRef.current, url, {
        width: 300,
        margin: 2,
        color: {
          dark: offer.public_brand_color || "#3B82F6",
          light: "#FFFFFF",
        },
      });
    }
  }, [offer]);

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

  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `qr-code-${offer?.public_slug}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    addToast("success", "QR Code téléchargé", "Le QR code a été téléchargé");
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
                    {offer.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
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

        {/* Colonne QR Code */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              QR Code
            </h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <canvas ref={canvasRef} />
              </div>
              
              <Button onClick={downloadQRCode} className="w-full mb-3">
                Télécharger QR Code
              </Button>
              
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Utilisez ce QR code sur vos affiches, salons, LinkedIn, etc.
              </p>
            </div>
          </div>

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
    </div>
  );
}

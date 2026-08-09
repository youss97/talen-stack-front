"use client";
import { useParams } from "next/navigation";
import PublicOfferApplyView from "@/components/public-offers/PublicOfferApplyView";

// Ancienne URL — redirige automatiquement vers /{companySlug}/{offerSlug} dès que la société
// a un slug configuré (voir PublicOfferApplyView), pour ne jamais casser un lien déjà partagé.
export default function LegacyPublicApplyPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <PublicOfferApplyView slug={slug} redirectToCanonical />;
}

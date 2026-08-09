"use client";
import { useParams } from "next/navigation";
import PublicOfferApplyView from "@/components/public-offers/PublicOfferApplyView";

// URL canonique d'une offre publique : /{slug-société}/{slug-offre}.
// Le lookup se fait uniquement par le slug de l'offre (déjà globalement unique) —
// companySlug n'est utilisé que pour la lisibilité/le branding de l'URL.
export default function PublicOfferPage() {
  const params = useParams();
  const offerSlug = params.offerSlug as string;

  return <PublicOfferApplyView slug={offerSlug} />;
}

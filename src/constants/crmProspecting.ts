// Valeurs stockées en base (français, identiques au tableur de prospection) + clé i18n d'affichage.
export const LEAD_STATUSES = [
  { value: "Nouveau", key: "new" },
  { value: "À contacter", key: "toContact" },
  { value: "Contacté", key: "contacted" },
  { value: "Qualifié", key: "qualified" },
  { value: "RDV planifié", key: "meetingScheduled" },
  { value: "Proposition envoyée", key: "proposalSent" },
  { value: "Gagné", key: "won" },
  { value: "Perdu", key: "lost" },
] as const;

export const PIPELINE_STAGES = [
  { value: "Prospection", key: "prospecting" },
  { value: "Prise de contact", key: "firstContact" },
  { value: "Qualification", key: "qualification" },
  { value: "Proposition", key: "proposal" },
  { value: "Négociation", key: "negotiation" },
  { value: "Signé", key: "signed" },
  { value: "Perdu", key: "lost" },
] as const;

export const PROSPECT_SOURCES = [
  { value: "LinkedIn", key: "linkedin" },
  { value: "Site web", key: "website" },
  { value: "Recommandation", key: "referral" },
  { value: "Salon/Événement", key: "event" },
  { value: "Appel à froid", key: "coldCall" },
  { value: "Emailing", key: "emailing" },
  { value: "Autre", key: "other" },
] as const;

export const PRIORITIES = [
  { value: "Haute", key: "high" },
  { value: "Moyenne", key: "medium" },
  { value: "Basse", key: "low" },
] as const;

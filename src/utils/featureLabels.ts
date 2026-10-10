// Libellés et icônes des modules (features) et pages, pour l'affichage côté super admin.
// Les clés correspondent au `name` (anglais) renvoyé par l'API ; l'affichage utilise
// `feature.display_name` (FR, depuis le seed) en priorité, avec fallback ici.

import type { Feature } from "@/types/role";
import type { LucideIcon } from "lucide-react";
import {
  KeyRound,
  UserCircle,
  Shield,
  Building2,
  User,
  ClipboardList,
  Users,
  Send,
  Tag,
  FileText,
  Gem,
  Mail,
  Megaphone,
  Calendar,
  Link2,
  BarChart3,
  Factory,
  Handshake,
  Settings,
} from "lucide-react";

export const FEATURE_ICONS: Record<string, string> = {
  "User Management": "🔑",
  "Profile Management": "👔",
  "Role & Permission Management": "🛡️",
  "Client Management": "🏢",
  "Client Managers": "👤",
  "Recruitment Requests": "📋",
  "Applications (Candidatures)": "👥",
  "Manager Client Requests": "📨",
  "Application Status Management": "🏷️",
  "Contract Type Management": "📄",
  "CV Management": "💎",
  "Email Management": "✉️",
  "Public Job Offers": "📢",
  "Agenda (Interviews)": "📅",
  "Integration Management": "🔗",
  "Activity Management": "📊",
  "Company Management": "🏭",
  "Assignment Management": "🤝",
};

// Fallback FR si le backend n'a pas (encore) de display_name
const FEATURE_LABELS_FR: Record<string, string> = {
  "User Management": "Gestion des utilisateurs",
  "Profile Management": "Profil",
  "Role & Permission Management": "Rôles & permissions",
  "Client Management": "Clients",
  "Client Managers": "Managers clients",
  "Recruitment Requests": "Demandes de recrutement",
  "Applications (Candidatures)": "Candidatures",
  "Manager Client Requests": "Mes demandes (manager)",
  "Application Status Management": "Statuts de candidature",
  "Contract Type Management": "Types de contrat",
  "CV Management": "CVthèque & vivier",
  "Email Management": "Emails",
  "Public Job Offers": "Offres publiques",
  "Agenda (Interviews)": "Agenda (entretiens)",
  "Integration Management": "Intégrations",
  "Activity Management": "Journaux d'activité",
  "Company Management": "Entreprises",
  "Assignment Management": "Affectations",
};

export const PAGE_LABELS_FR: Record<string, string> = {
  users: "Utilisateurs",
  profile: "Profil",
  roles: "Rôles",
  clients: "Clients",
  managers: "Managers",
  "recruitment-requests": "Demandes de recrutement",
  applications: "Candidatures",
  "my-requests": "Mes demandes",
  "application-statuses": "Statuts",
  "contract-types": "Types de contrat",
  cvs: "CVs",
  emails: "Emails",
  "public-offers": "Offres publiques",
  agenda: "Agenda",
  integrations: "Intégrations",
  logs: "Journaux d'activité",
  companies: "Entreprises",
  assignments: "Affectations",
};

export function featureLabel(feature: Pick<Feature, "name" | "display_name">): string {
  return feature.display_name || FEATURE_LABELS_FR[feature.name] || feature.name;
}

export function featureIcon(name: string): string {
  return FEATURE_ICONS[name] || "⚙️";
}

// Version icône de bibliothèque (lucide-react) de featureIcon ci-dessus — à utiliser pour tout
// nouvel affichage ; featureIcon (émoji) reste pour les écrans pas encore migrés.
export const FEATURE_ICON_COMPONENTS: Record<string, LucideIcon> = {
  "User Management": KeyRound,
  "Profile Management": UserCircle,
  "Role & Permission Management": Shield,
  "Client Management": Building2,
  "Client Managers": User,
  "Recruitment Requests": ClipboardList,
  "Applications (Candidatures)": Users,
  "Manager Client Requests": Send,
  "Application Status Management": Tag,
  "Contract Type Management": FileText,
  "CV Management": Gem,
  "Email Management": Mail,
  "Public Job Offers": Megaphone,
  "Agenda (Interviews)": Calendar,
  "Integration Management": Link2,
  "Activity Management": BarChart3,
  "Company Management": Factory,
  "Assignment Management": Handshake,
};

export function featureIconComponent(name: string): LucideIcon {
  return FEATURE_ICON_COMPONENTS[name] || Settings;
}

export function pageLabel(name: string): string {
  return PAGE_LABELS_FR[name] || name;
}

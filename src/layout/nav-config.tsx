import {
  GroupIcon,
  UserIcon,
  UserCircleIcon,
  FileIcon,
  TaskIcon,
  DocsIcon,
  ListIcon,
  LockIcon,
  GridIcon,
  EnvelopeIcon,
  CalenderIcon,
} from "../icons/index";
import { Handshake, Building2, LayoutDashboard, ClipboardList, ClipboardCheck, Code2 } from "lucide-react";

// ----------------------------------------------------------------------

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  group?: string;
};

// Ordre d'affichage des groupes dans la sidebar
export const GROUP_ORDER = [
  "Pilotage",
  "Commercial",
  "Recrutement",
  "Talents",
  "Suivi",
  "Communication",
  "Administration",
] as const;

export const NAV_CONFIG: Record<string, { title: string; icon: React.ReactNode; group?: string }> = {
  "/statistics": {
    title: "Statistiques",
    icon: <GridIcon />,
    group: "Pilotage",
  },
  "/settings/landing": {
    title: "Site vitrine",
    icon: <DocsIcon />,
    group: "Administration",
  },
  "/companies": {
    title: "Entreprises",
    icon: <GroupIcon />,
    group: "Administration",
  },
  "/clients": {
    title: "Clients",
    icon: <UserCircleIcon />,
    group: "Administration",
  },
  "/managers": {
    title: "Collaborateurs",
    icon: <UserIcon />,
    group: "Administration",
  },
  "/users": {
    title: "Utilisateurs",
    icon: <UserIcon />,
    group: "Administration",
  },
  "/recruitment-requests": {
    title: "Recrutement",
    icon: <FileIcon />,
    group: "Recrutement",
  },
  "/applications": {
    title: "Candidatures",
    icon: <TaskIcon />,
    group: "Recrutement",
  },
  "/agenda": {
    title: "Agenda",
    icon: <CalenderIcon />,
    group: "Suivi",
  },
  "/interviews": {
    title: "Entretiens",
    icon: <CalenderIcon />,
    group: "Suivi",
  },
  "/integrations": {
    title: "Intégrations",
    icon: <UserCircleIcon />,
    group: "Suivi",
  },
  "/cvs": {
    title: "Vivier de talents",
    icon: <GroupIcon />,
    group: "Talents",
  },
  "/my-requests": {
    title: "Mes recrutements",
    icon: <FileIcon />,
    group: "Recrutement",
  },
  "/public-offers": {
    title: "Offres Publiques",
    icon: <DocsIcon />,
    group: "Recrutement",
  },
  "/emails": {
    title: "Emails",
    icon: <EnvelopeIcon />,
    group: "Communication",
  },
  "/logs": {
    title: "Logs",
    icon: <ListIcon />,
    group: "Administration",
  },
  "/roles": {
    title: "Rôles",
    icon: <LockIcon />,
    group: "Administration",
  },
  "/subscriptions": {
    title: "Abonnements",
    icon: <GridIcon />,
    group: "Administration",
  },
  "/assignments": {
    title: "Affectations",
    icon: <GroupIcon />,
    group: "Administration",
  },
  "/business-cards": {
    title: "Cartes de visite",
    icon: <UserCircleIcon />,
    group: "Administration",
  },
  "/crm-companies": {
    title: "Prospects",
    icon: <Building2 size={18} strokeWidth={1.8} />,
    group: "Commercial",
  },
  "/crm-deals": {
    title: "Opportunités",
    icon: <Handshake size={18} strokeWidth={1.8} />,
    group: "Commercial",
  },
  "/crm-dashboard": {
    title: "Tableau de bord CRM",
    icon: <LayoutDashboard size={18} strokeWidth={1.8} />,
    group: "Commercial",
  },
  "/test-questions": {
    title: "Tests techniques & psychotechniques",
    icon: <ClipboardList size={18} strokeWidth={1.8} />,
    group: "Talents",
  },
  "/test-sessions": {
    title: "Tests envoyés",
    icon: <ClipboardCheck size={18} strokeWidth={1.8} />,
    group: "Talents",
  },
  "/coding-challenges": {
    title: "Exercices de code",
    icon: <Code2 size={18} strokeWidth={1.8} />,
    group: "Talents",
  },
};

// Default icon for paths not in config
export const DEFAULT_ICON = <GridIcon />;

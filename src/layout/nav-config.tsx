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
    title: "Mes Offres",
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
    group: "Talents",
  },
  "/business-cards": {
    title: "Cartes de visite",
    icon: <UserCircleIcon />,
    group: "Administration",
  },
};

// Default icon for paths not in config
export const DEFAULT_ICON = <GridIcon />;

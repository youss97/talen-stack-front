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
};

export const NAV_CONFIG: Record<string, { title: string; icon: React.ReactNode }> = {
  "/companies": {
    title: "Entreprises",
    icon: <GroupIcon />,
  },
  "/clients": {
    title: "Clients",
    icon: <UserCircleIcon />,
  },
  "/managers": {
    title: "Managers",
    icon: <UserIcon />,
  },
  "/users": {
    title: "Utilisateurs",
    icon: <UserIcon />,
  },
  "/recruitment-requests": {
    title: "Recrutement",
    icon: <FileIcon />,
  },
  "/applications": {
    title: "Candidatures",
    icon: <TaskIcon />,
  },
  "/agenda": {
    title: "Agenda",
    icon: <CalenderIcon />,
  },
  "/interviews": {
    title: "Entretiens",
    icon: <CalenderIcon />,
  },
  "/integrations": {
    title: "Intégrations",
    icon: <UserCircleIcon />,
  },
  "/cvs": {
    title: "Vivier de talents",
    icon: <GroupIcon />,
  },
  "/my-requests": {
    title: "Mes Offres",
    icon: <FileIcon />,
  },
  "/public-offers": {
    title: "Offres Publiques",
    icon: <DocsIcon />,
  },
  "/emails": {
    title: "Emails",
    icon: <EnvelopeIcon />,
  },
  "/logs": {
    title: "Logs",
    icon: <ListIcon />,
  },
  "/roles": {
    title: "Rôles",
    icon: <LockIcon />,
  },
  // Ajoutez d'autres paths ici selon vos besoins
};

// Default icon for paths not in config
export const DEFAULT_ICON = <GridIcon />;

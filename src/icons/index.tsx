import React from "react";
import {
  Plus,
  X,
  Box,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Zap,
  ArrowUp,
  ArrowDown,
  Folder,
  Video,
  Music2,
  LayoutGrid,
  File,
  Download,
  ArrowRight,
  Users,
  Package,
  Sparkles,
  DollarSign,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  Send,
  Lock,
  Mail,
  User,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  Copy,
  ChevronLeft,
  UserCircle2,
  ListChecks,
  List,
  Table,
  FileText,
  PieChart,
  Plug,
  Files,
  MoreHorizontal,
  MessageCircle,
  MoreVertical,
  Bell,
  type LucideIcon,
} from "lucide-react";

/**
 * Bibliothèque d'icônes du site — basée sur lucide-react (jeu d'icônes pro, cohérent).
 * Chaque icône reçoit par défaut une légère ombre portée verte ("icon-glow", cf. globals.css).
 * Les noms exportés sont conservés à l'identique pour ne pas casser les imports existants.
 */
function wrap(Lucide: LucideIcon) {
  return function WrappedIcon({
    className = "",
    size = 20,
    strokeWidth = 1.8,
    ...rest
  }: React.ComponentProps<LucideIcon>) {
    return (
      <Lucide
        className={`icon-glow ${className}`.trim()}
        size={size}
        strokeWidth={strokeWidth}
        {...rest}
      />
    );
  };
}

export const PlusIcon = wrap(Plus);
export const CloseIcon = wrap(X);
export const BoxIcon = wrap(Box);
export const CheckCircleIcon = wrap(CheckCircle2);
export const AlertIcon = wrap(AlertTriangle);
export const InfoIcon = wrap(Info);
export const ErrorIcon = wrap(XCircle);
export const BoltIcon = wrap(Zap);
export const ArrowUpIcon = wrap(ArrowUp);
export const ArrowDownIcon = wrap(ArrowDown);
export const FolderIcon = wrap(Folder);
export const VideoIcon = wrap(Video);
export const AudioIcon = wrap(Music2);
export const GridIcon = wrap(LayoutGrid);
export const FileIcon = wrap(File);
export const DownloadIcon = wrap(Download);
export const ArrowRightIcon = wrap(ArrowRight);
export const GroupIcon = wrap(Users);
export const BoxIconLine = wrap(Package);
export const ShootingStarIcon = wrap(Sparkles);
export const DollarLineIcon = wrap(DollarSign);
export const TrashBinIcon = wrap(Trash2);
export const AngleUpIcon = wrap(ChevronUp);
export const AngleDownIcon = wrap(ChevronDown);
export const PencilIcon = wrap(Pencil);
export const CheckLineIcon = wrap(Check);
export const CloseLineIcon = wrap(X);
export const ChevronDownIcon = wrap(ChevronDown);
export const ChevronUpIcon = wrap(ChevronUp);
export const PaperPlaneIcon = wrap(Send);
export const LockIcon = wrap(Lock);
export const EnvelopeIcon = wrap(Mail);
export const UserIcon = wrap(User);
export const CalenderIcon = wrap(Calendar);
export const EyeIcon = wrap(Eye);
export const EyeCloseIcon = wrap(EyeOff);
export const TimeIcon = wrap(Clock);
export const CopyIcon = wrap(Copy);
export const ChevronLeftIcon = wrap(ChevronLeft);
export const UserCircleIcon = wrap(UserCircle2);
export const TaskIcon = wrap(ListChecks);
export const ListIcon = wrap(List);
export const TableIcon = wrap(Table);
export const PageIcon = wrap(FileText);
export const PieChartIcon = wrap(PieChart);
export const BoxCubeIcon = wrap(Package);
export const PlugInIcon = wrap(Plug);
export const DocsIcon = wrap(Files);
export const MailIcon = wrap(Mail);
export const HorizontaLDots = wrap(MoreHorizontal);
export const ChatIcon = wrap(MessageCircle);
export const MoreDotIcon = wrap(MoreVertical);
export const BellIcon = wrap(Bell);

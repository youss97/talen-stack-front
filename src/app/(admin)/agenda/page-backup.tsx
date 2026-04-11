"use client";
import { useState, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-styles.css";
import { useGetAllInterviewsQuery, useChangeInterviewStatusMutation, useDeleteInterviewMutation } from "@/lib/services/interviewApi";
import Button from "@/components/ui/button/Button";
import InterviewDetailModal from "@/components/interviews/InterviewDetailModal";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { ToastContainer } from "@/components/ui/toast/Toast";
import { useToast } from "@/hooks/useToast";
import type { Interview } from "@/types/interview";

// Configuration de moment en français
moment.locale("fr");
const localizer = momentLocalizer(moment);

// Messages en français pour le calendrier
const messages = {
  allDay: "Toute la journée",
  previous: "Précédent",
  next: "Suivant",
  today: "Aujourd'hui",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  date: "Date",
  time: "Heure",
  event: "Événement",
  noEventsInRange: "Aucun entretien dans cette période",
  showMore: (total: number) => `+ ${total} de plus`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Interview;
}

// SAUVEGARDE DE LA PAGE AGENDA ORIGINALE
export default function AgendaPageBackup() {
  return <div>Sauvegarde de la page agenda</div>;
}
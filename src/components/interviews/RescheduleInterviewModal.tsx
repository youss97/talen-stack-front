"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import type { Interview } from "@/types/interview";

interface RescheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  onReschedule: (interviewId: string, newDate: Date, newDuration?: number) => Promise<void>;
  isLoading?: boolean;
}

export default function RescheduleInterviewModal({
  isOpen,
  onClose,
  interview,
  onReschedule,
  isLoading = false,
}: RescheduleInterviewModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState(interview.duration_minutes.toString());
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newDate || !newTime) {
      setError("Veuillez sélectionner une date et une heure");
      return;
    }

    try {
      // Combiner la date et l'heure
      const combinedDateTime = new Date(`${newDate}T${newTime}`);
      
      // Vérifier que la date est dans le futur
      if (combinedDateTime <= new Date()) {
        setError("La nouvelle date doit être dans le futur");
        return;
      }

      await onReschedule(interview.id, combinedDateTime, parseInt(newDuration));
      onClose();
      
      // Reset form
      setNewDate("");
      setNewTime("");
      setNewDuration(interview.duration_minutes.toString());
    } catch (err) {
      setError("Erreur lors du report de l'entretien");
    }
  };

  const handleClose = () => {
    setError("");
    setNewDate("");
    setNewTime("");
    setNewDuration(interview.duration_minutes.toString());
    onClose();
  };

  // Formater la date actuelle pour l'affichage
  const currentDate = new Date(interview.scheduled_date);
  const candidateName = interview.application?.cv
    ? `${interview.application.cv.candidate_first_name || ""} ${interview.application.cv.candidate_last_name || ""}`.trim()
    : "Candidat";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md mx-4">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          📅 Reporter l'entretien
        </h2>

        {/* Informations actuelles */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Entretien actuel
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div><strong>Candidat:</strong> {candidateName}</div>
            <div><strong>Date actuelle:</strong> {currentDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}</div>
            <div><strong>Heure actuelle:</strong> {currentDate.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
            <div><strong>Durée:</strong> {interview.duration_minutes} minutes</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nouvelle date */}
          <div>
            <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouvelle date *
            </label>
            <input
              type="date"
              id="newDate"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Minimum aujourd'hui
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Nouvelle heure */}
          <div>
            <label htmlFor="newTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouvelle heure *
            </label>
            <input
              type="time"
              id="newTime"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Durée */}
          <div>
            <label htmlFor="newDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durée (minutes)
            </label>
            <select
              id="newDuration"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 heure</option>
              <option value="90">1h30</option>
              <option value="120">2 heures</option>
            </select>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Note d'information */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              ℹ️ Un email de notification sera automatiquement envoyé au candidat et aux invités pour les informer du report.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Report en cours..." : "📅 Reporter l'entretien"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
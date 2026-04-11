"use client";
import { useState, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-styles.css";

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
  resource?: any;
}

export default function AgendaPageSimple() {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  // ÉVÉNEMENTS DE TEST FORCÉS - TOUJOURS VISIBLES
  const events: CalendarEvent[] = useMemo(() => {
    const now = new Date();
    
    // Créer des événements de test pour les 7 prochains jours
    const testEvents: CalendarEvent[] = [];
    
    for (let i = 0; i < 7; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() + i);
      eventDate.setHours(9 + (i % 3) * 2, 0, 0, 0); // 9h, 11h, 13h alternativement
      
      const endDate = new Date(eventDate);
      endDate.setHours(eventDate.getHours() + 1); // 1 heure de durée
      
      testEvents.push({
        id: `test-${i}`,
        title: `Entretien Test ${i + 1}`,
        start: eventDate,
        end: endDate,
        resource: {
          status: i % 3 === 0 ? 'scheduled' : i % 3 === 1 ? 'completed' : 'cancelled',
        }
      });
    }
    
    console.log("🔍 ÉVÉNEMENTS FORCÉS:", testEvents);
    return testEvents;
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    console.log("Événement sélectionné:", event);
    alert(`Événement: ${event.title}`);
  }, []);

  // Style des événements selon le statut
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource?.status || 'scheduled';
    let backgroundColor = "#3b82f6";
    
    switch (status) {
      case "scheduled":
        backgroundColor = "#3b82f6"; // Bleu
        break;
      case "completed":
        backgroundColor = "#10b981"; // Vert
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // Rouge
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor: backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        fontSize: "12px",
        padding: "2px 4px",
      },
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          📅 Agenda TEST SIMPLE
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {events.length} événement{events.length > 1 ? "s" : ""} de test
        </p>
      </div>

      {/* DEBUG INFO */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
        <strong>🔍 DEBUG SIMPLE:</strong>
        <br />• Événements de test: <strong>{events.length}</strong>
        <br />• Vue actuelle: <strong>{view}</strong>
        <br />• Date actuelle: <strong>{date.toLocaleDateString('fr-FR')}</strong>
        <br />• Premier événement: <strong>{events[0]?.title} - {events[0]?.start.toLocaleString('fr-FR')}</strong>
      </div>

      {/* Calendrier SIMPLE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" 
           style={{ height: "600px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
        />
      </div>
    </div>
  );
}
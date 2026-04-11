"use client";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configuration de moment en français
moment.locale("fr");
const localizer = momentLocalizer(moment);

// Événements de test simples
const testEvents = [
  {
    id: 1,
    title: 'ÉVÉNEMENT TEST SIMPLE',
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000),
  },
  {
    id: 2,
    title: 'ÉVÉNEMENT DEMAIN',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000),
    end: new Date(Date.now() + 25 * 60 * 60 * 1000),
  }
];

export default function TestCalendar() {
  console.log("🔍 TEST CALENDAR - Événements:", testEvents);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Calendrier Simple</h1>
      <div style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={testEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          defaultView="month"
        />
      </div>
    </div>
  );
}
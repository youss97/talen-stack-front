declare module 'react-big-calendar' {
  import { ComponentType } from 'react';

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';
  
  export interface Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    type?: string;
    [key: string]: any;
  }

  export type DateRange = { start: Date; end: Date };
  
  export type FormatFunction = 
    | ((date: Date, culture?: string, localizer?: any) => string)
    | ((range: DateRange, culture?: string, localizer?: any) => string);

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    titleAccessor?: string | ((event: Event) => string);
    allDayAccessor?: string | ((event: Event) => boolean);
    resourceAccessor?: string | ((event: Event) => any);
    view?: View;
    defaultView?: View;
    views?: View[] | { [key: string]: boolean | ComponentType };
    onView?: (view: View) => void;
    date?: Date;
    defaultDate?: Date;
    onNavigate?: (date: Date, view: View, action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => void;
    onSelectEvent?: (event: Event, e: React.SyntheticEvent) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[]; action: 'select' | 'click' | 'doubleClick' }) => void;
    selectable?: boolean | 'ignoreEvents';
    style?: React.CSSProperties;
    className?: string;
    messages?: { [key: string]: string | ((total: number) => string) };
    components?: { [key: string]: ComponentType<any> };
    formats?: { [key: string]: string | FormatFunction };
    culture?: string;
    min?: Date;
    max?: Date;
    scrollToTime?: Date;
    step?: number;
    timeslots?: number;
    eventPropGetter?: (event: Event, start: Date, end: Date, isSelected: boolean) => { className?: string; style?: React.CSSProperties };
    slotPropGetter?: (date: Date) => { className?: string; style?: React.CSSProperties };
    dayPropGetter?: (date: Date) => { className?: string; style?: React.CSSProperties };
    popup?: boolean;
    popupOffset?: number | { x: number; y: number };
    toolbar?: boolean;
    length?: number;
    showMultiDayTimes?: boolean;
    drilldownView?: View | null;
    getDrilldownView?: (targetDate: Date, currentViewName: View, configuredViewNames: View[]) => View | null;
    dayLayoutAlgorithm?: string;
  }

  export const Calendar: ComponentType<CalendarProps>;

  export function momentLocalizer(moment: any): any;
  export function dateFnsLocalizer(config: any): any;
  export function globalizeLocalizer(globalizeInstance: any): any;

  export const Views: {
    MONTH: 'month';
    WEEK: 'week';
    WORK_WEEK: 'work_week';
    DAY: 'day';
    AGENDA: 'agenda';
  };

  export const Navigate: {
    PREVIOUS: 'PREV';
    NEXT: 'NEXT';
    TODAY: 'TODAY';
    DATE: 'DATE';
  };
}

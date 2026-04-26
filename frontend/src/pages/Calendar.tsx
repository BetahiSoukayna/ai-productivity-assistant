import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Zap
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/src/lib/utils';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'travail' | 'personnel' | 'important';
  location?: string;
  participants?: string[];
}

const mockEvents: Event[] = [
  { 
    id: '1', 
    title: 'Synchro Produit', 
    start: new Date(2026, 3, 21, 10, 0), 
    end: new Date(2026, 3, 21, 11, 0),
    type: 'travail',
    location: 'Salle de réunion B',
    participants: ['Sarah', 'Michel']
  },
  { 
    id: '2', 
    title: 'Revue Stratégique', 
    start: new Date(2026, 3, 21, 14, 0), 
    end: new Date(2026, 3, 21, 15, 30),
    type: 'important'
  },
  { 
    id: '3', 
    title: 'Déjeuner avec Émilie', 
    start: new Date(2026, 3, 22, 12, 0), 
    end: new Date(2026, 3, 22, 13, 0),
    type: 'personnel'
  }
];

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = React.useState(new Date(2026, 3, 21));
  const [selectedDate, setSelectedDate] = React.useState(new Date(2026, 3, 21));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const eventsOnSelectedDate = mockEvents.filter(event => isSameDay(event.start, selectedDate));

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-8">
      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-gray-900 font-sans capitalize">{format(currentDate, 'MMMM yyyy', { locale: fr })}</h2>
            <div className="flex border border-gray-100 rounded-xl overflow-hidden p-0.5 bg-gray-50">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg hover:shadow-sm transition-all text-gray-400 hover:text-gray-900">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Aujourd'hui
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg hover:shadow-sm transition-all text-gray-400 hover:text-gray-900">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
               <button className="px-5 py-2 text-xs font-bold bg-white text-blue-600 rounded-lg shadow-sm">Mois</button>
               <button className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Semaine</button>
               <button className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Jour</button>
             </div>
             <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all">
                <Plus className="h-5 w-5" />
             </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 border-collapse overflow-y-auto">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="p-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-r border-gray-50 last:border-r-0 bg-gray-50/30">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            const dateEvents = mockEvents.filter(e => isSameDay(e.start, day));
            return (
              <div 
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-gray-50 last:border-r-0 cursor-pointer transition-colors relative group",
                  !isSameMonth(day, monthStart) ? "bg-gray-50/50" : "hover:bg-blue-50/30",
                  isSameDay(day, selectedDate) ? "bg-blue-50/50" : ""
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold",
                    isToday(day) ? "bg-blue-600 text-white" : "text-gray-900"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1 overflow-hidden">
                  {dateEvents.map(event => (
                    <div 
                      key={event.id}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold truncate border",
                        event.type === 'travail' ? "bg-blue-50 text-blue-700 border-blue-100" :
                        event.type === 'important' ? "bg-red-50 text-red-700 border-red-100" :
                        "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}
                    >
                      {format(event.start, 'HH:mm')} {event.title}
                    </div>
                  ))}
                </div>
                
                <button className="absolute bottom-2 right-2 p-1 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Sidebar */}
      <div className="w-96 flex flex-col gap-6">
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col max-h-[60%] overflow-hidden">
          <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
               <p className="text-sm font-bold text-blue-600 uppercase tracking-widest capitalize">{format(selectedDate, 'EEEE', { locale: fr })}</p>
               <h3 className="text-2xl font-bold text-gray-900">{format(selectedDate, 'do MMMM', { locale: fr })}</h3>
             </div>
             <button className="text-gray-400 hover:text-gray-900 transition-colors">
               <Plus className="h-6 w-6" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-4 -mr-4">
            {eventsOnSelectedDate.length > 0 ? (
              eventsOnSelectedDate.map(event => (
                <div key={event.id} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:rounded-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {event.participants && (
                     <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                           {event.participants.map((p, i) => (
                             <div key={i} className="h-7 w-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                               {p[0]}
                             </div>
                           ))}
                        </div>
                        <span className="text-xs text-gray-400 font-medium tracking-tight">Réunion avec {event.participants.join(', ')}</span>
                     </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                 <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-gray-200" />
                 </div>
                 <p className="text-gray-500 font-medium">Aucun événement prévu aujourd'hui.</p>
                 <button className="mt-4 text-sm font-bold text-blue-600 hover:underline">Ajouter un événement</button>
              </div>
            )}
          </div>
        </section>

        <section className="flex-1 ai-gradient rounded-3xl p-8 text-white shadow-deep relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2 italic font-sans">
               <Sparkles className="h-5 w-5 text-amber-300" /> Conseil d'IA
            </h4>
            <p className="text-white/90 text-sm leading-relaxed font-medium opacity-90">
              J'ai remarqué un créneau entre 14h et 16h. Demain pourrait être le moment idéal pour avancer sur la stratégie que vous n'avez pas ouverte récemment.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button className="w-full bg-white text-blue-700 py-3 rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] transition-all">
                Bloquer un temps de travail
              </button>
              <button className="w-full bg-white/10 text-white font-bold py-3 rounded-xl text-sm border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm">
                Me rappeler demain
              </button>
            </div>
          </div>
          
          <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        </section>
      </div>
    </div>
  );
};

export default CalendarPage;

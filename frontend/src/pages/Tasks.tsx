import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Grid,
  List as ListIcon,
  Filter,
  Star,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  title: string;
  priority: 'haute' | 'moyenne' | 'basse';
  dueDate: string;
  completed: boolean;
  source?: string;
  tags?: string[];
}

const mockTasks: Task[] = [
  { id: '1', title: 'Répondre à Sarah Wilson concernant la stratégie Q2', priority: 'haute', dueDate: 'Aujourd\'hui', completed: false, source: 'Email', tags: ['Stratégie'] },
  { id: '2', title: 'Préparer le deck pour la réunion de direction', priority: 'haute', dueDate: 'Demain', completed: false, tags: ['Management'] },
  { id: '3', title: 'Mise à jour de la documentation Projet Alpha', priority: 'moyenne', dueDate: '25 avril', completed: false, tags: ['Docs'] },
  { id: '4', title: 'Révision des rapports de dépenses', priority: 'basse', dueDate: 'Semaine pro', completed: true, tags: ['Finance'] },
  { id: '5', title: 'Session de feedback hebdo avec l\'équipe', priority: 'moyenne', dueDate: 'Vendredi', completed: false, tags: ['RH'] },
];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [view, setView] = useState<'list' | 'grid'>('list');

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const highPriority = tasks.filter(t => t.priority === 'haute' && !t.completed);
  const others = tasks.filter(t => t.priority !== 'haute' && !t.completed);
  const completed = tasks.filter(t => t.completed);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Tâches</h1>
          <p className="text-gray-500 mt-1 font-medium">Gérez les actions de votre espace de travail.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm shrink-0">
             <button 
               onClick={() => setView('list')}
               className={cn("p-2 rounded-lg transition-colors", view === 'list' ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600")}
             >
               <ListIcon className="h-5 w-5" />
             </button>
             <button 
               onClick={() => setView('grid')}
               className={cn("p-2 rounded-lg transition-colors", view === 'grid' ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600")}
             >
               <Grid className="h-5 w-5" />
             </button>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
            <Plus className="h-5 w-5" /> Nouvelle tâche
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1 space-y-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
             <div className="relative flex-1 w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Rechercher vos tâches..." 
                 className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
               />
             </div>
             <div className="flex items-center gap-3 shrink-0">
                <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                   <Filter className="h-4 w-4" /> Filtres
                </button>
                <div className="h-6 w-px bg-gray-100"></div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                   Trier par : <span className="text-gray-900 cursor-pointer hover:underline underline-offset-4">Échéance</span>
                </div>
             </div>
          </div>

          <AnimatePresence mode="popLayout">
            {[
              { title: 'Haute priorité', icon: AlertCircle, color: 'text-red-600', data: highPriority },
              { title: 'Tâches actives', icon: Clock, color: 'text-blue-600', data: others },
              { title: 'Complétées', icon: CheckCircle2, color: 'text-emerald-600', data: completed },
            ].map((section, sidx) => (
              section.data.length > 0 && (
                <motion.section 
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sidx * 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 px-2">
                    <section.icon className={cn("h-5 w-5", section.color)} />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{section.title}</h3>
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{section.data.length}</span>
                  </div>

                  <div className={cn(
                    view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"
                  )}>
                    {section.data.map((task) => (
                      <motion.div 
                        layout
                        key={task.id}
                        className={cn(
                          "bg-white border rounded-2xl p-5 shadow-sm transition-all group flex items-start gap-4",
                          task.completed ? "border-gray-50 opacity-60" : "border-gray-100 hover:border-blue-200 hover:shadow-md"
                        )}
                      >
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "mt-1 shrink-0 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 group-hover:border-blue-400"
                          )}
                        >
                          {task.completed && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        
                        <div className="flex-1 min-w-0 space-y-3">
                           <div>
                             <h4 className={cn("text-base font-bold leading-tight", task.completed ? "line-through text-gray-500" : "text-gray-900")}>
                               {task.title}
                             </h4>
                             <div className="flex flex-wrap items-center gap-3 mt-2">
                               <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                                 <Calendar className="h-3.5 w-3.5" /> {task.dueDate}
                               </div>
                               {task.source && (
                                 <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                   Depuis {task.source}
                                 </div>
                               )}
                               {task.tags && task.tags.map(tag => (
                                 <span key={tag} className="text-[10px] font-bold text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">#{tag}</span>
                               ))}
                             </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Star className="h-4 w-4" /></button>
                           <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"><MoreVertical className="h-4 w-4" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )
            ))}
          </AnimatePresence>
        </main>

        <aside className="w-full lg:w-80 shrink-0 space-y-6">
           <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Analyses de productivité</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Objectif hebdo</span>
                    <span className="text-sm font-bold text-gray-900">12/20</span>
                 </div>
                 <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-center">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SERIE</p>
                       <p className="text-xl font-bold text-gray-900">5 Jours</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-center">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">FOCUS</p>
                       <p className="text-xl font-bold text-gray-900">88%</p>
                    </div>
                 </div>
              </div>
           </section>

           <section className="ai-gradient rounded-3xl p-8 text-white shadow-deep relative overflow-hidden group border border-indigo-700/30">
              <div className="relative z-10">
                 <h4 className="text-lg font-bold mb-3 flex items-center gap-2 italic">
                   <Sparkles className="h-5 w-5 text-amber-300" /> Résumé IA
                 </h4>
                 <p className="text-white/90 text-sm leading-relaxed opacity-90 font-medium">
                    Vous terminez vos tâches plus vite cette semaine. Concentrer vos efforts avant 11h semble être votre moment idéal.
                 </p>
                 <button className="mt-8 text-sm font-bold bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 w-full shadow-lg">
                    Voir l'analyse complète
                 </button>
              </div>
              <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
           </section>
        </aside>
      </div>
    </div>
  );
};

export default Tasks;

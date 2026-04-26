import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Mail, 
  Calendar, 
  Clock, 
  FileText,
  ArrowUpRight,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const stats = [
  { label: 'E-mails non lus', value: '12', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Réunions aujourd\'hui', value: '4', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Tâches en attente', value: '8', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Docs récents', value: '24', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const activity = [
  { id: 1, type: 'email', title: 'Nouvelle proposition de projet de Sarah', time: 'il y a 10 min', status: 'Important' },
  { id: 2, type: 'calendar', title: 'Réunion de planification de sprint', time: '2 heures restantes', status: 'À venir' },
  { id: 3, type: 'task', title: 'Préparer la revue du budget Q2', time: 'Pour aujourd\'hui', status: 'Urgent' },
  { id: 4, type: 'doc', title: 'Plan_Strategique_2025.pdf', time: 'Modifié hier', status: 'Brouillon' },
];

const itemsContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
          Bon retour par ici, <span className="text-blue-600">Jean</span>
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Voici ce qu'il se passe aujourd'hui dans votre espace de travail.</p>
      </header>

      {/* Stats Grid */}
      <motion.div 
        variants={itemsContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-stats gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
      >
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-deep transition-all duration-300 group flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-8">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Actions prioritaires récentes</h2>
              <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                Voir tout <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {activity.map((item) => (
                <div key={item.id} className="p-5 hover:bg-gray-50/50 transition-colors flex items-center gap-5 cursor-pointer group">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border border-gray-100 bg-white shadow-sm",
                    item.type === 'email' ? 'text-blue-500' : 
                    item.type === 'calendar' ? 'text-purple-500' :
                    item.type === 'task' ? 'text-emerald-500' : 'text-amber-500'
                  )}>
                    {item.type === 'email' && <Mail className="h-5 w-5" />}
                    {item.type === 'calendar' && <Calendar className="h-5 w-5" />}
                    {item.type === 'task' && <Clock className="h-5 w-5" />}
                    {item.type === 'doc' && <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-0.5">{item.time}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      item.status === 'Important' || item.status === 'Urgent' ? 'bg-red-50 text-red-600' :
                      item.status === 'À venir' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.status}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* AI Assistant Summary Tool */}
        <div className="lg:col-span-4">
          <section className="ai-gradient rounded-3xl p-8 text-white shadow-deep h-full relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm h-12 w-12 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold leading-tight">Brief quotidien IA</h2>
              <p className="text-white/90 mt-3 text-lg opacity-90 leading-relaxed">
                Vous avez 3 tâches prioritaires aujourd'hui. Votre après-midi est libre pour le travail de fond après la réunion de 14h.
              </p>
            </div>
            
            <div className="mt-8 space-y-4 relative z-10">
              <button className="w-full bg-white text-blue-700 font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Générer un planning intelligent
              </button>
              <button className="w-full bg-white/10 text-white border border-white/20 font-bold py-4 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm">
                Voir les analyses de productivité
              </button>
            </div>

            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

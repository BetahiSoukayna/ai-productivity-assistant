import React from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Zap, 
  ChevronRight,
  LogOut,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';

const Settings: React.FC = () => {
  const { user } = useStore();

  const sections = [
    {
      title: 'Informations Personnelles',
      icon: User,
      items: [
        { label: 'Nom affiché', value: user.name, type: 'text' },
        { label: 'Adresse e-mail', value: user.email, type: 'text' },
        { label: 'Poste', value: 'Planificateur Stratégique Senior', type: 'text' },
      ]
    },
    {
      title: 'Préférences IA',
      icon: Zap,
      items: [
        { label: 'Sélection du modèle', value: 'Gemini 3.1 Pro (Dernier)', type: 'select' },
        { label: 'Style de réponse', value: 'Concis & Professionnel', type: 'select' },
        { label: 'Résumé automatique', value: 'Activé', type: 'toggle' },
      ]
    },
    {
      title: 'Intégrations',
      icon: Database,
      items: [
        { label: 'Google Gmail', value: 'Connecté', icon: Mail, color: 'text-blue-500' },
        { label: 'Google Drive', value: 'Connecté', icon: FileText, color: 'text-indigo-500' },
        { label: 'Google Calendar', value: 'Connecté', icon: Calendar, color: 'text-purple-500' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Paramètres</h1>
        <p className="text-gray-500 mt-1 font-medium">Gérez votre profil, vos préférences et vos configurations IA.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Navigation Rail */}
        <aside className="md:col-span-3 space-y-2">
           {[
             { label: 'Profil', icon: User, active: true },
             { label: 'Sécurité', icon: Shield },
             { label: 'Notifications', icon: Bell },
             { label: 'Langue', icon: Globe },
             { label: 'Intégrations', icon: Database },
           ].map((item, idx) => (
             <button 
               key={idx}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                 item.active ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-500 hover:bg-gray-100"
               )}
             >
               <item.icon className="h-4 w-4" />
               {item.label}
             </button>
           ))}
           <div className="pt-4 mt-4 border-t border-gray-100">
             <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
               <LogOut className="h-4 w-4" />
               Se déconnecter
             </button>
           </div>
        </aside>

        {/* Settings Content */}
        <div className="md:col-span-9 space-y-10">
          {sections.map((section, idx) => (
            <section key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <section.icon className="h-4 w-4 text-gray-900" />
                  </div>
                  <h3 className="font-bold text-gray-900">{section.title}</h3>
               </div>
               <div className="divide-y divide-gray-50">
                  {section.items.map((item, iidx) => (
                    <div key={iidx} className="p-6 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
                       <div className="flex items-center gap-4">
                          {item.icon && <item.icon className={cn("h-5 w-5", item.color)} />}
                          <div className="space-y-0.5">
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                             <p className="text-sm font-bold text-gray-900">{item.value}</p>
                          </div>
                       </div>
                       <button className="text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors opacity-0 group-hover:opacity-100">
                         Modifier
                       </button>
                    </div>
                  ))}
               </div>
            </section>
          ))}
          
          <div className="pt-4 flex justify-end gap-3">
             <button className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Annuler les modifications</button>
             <button className="px-8 py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all">
               Enregistrer les préférences
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

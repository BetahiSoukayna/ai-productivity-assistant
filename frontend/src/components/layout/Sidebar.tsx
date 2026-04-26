import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mail, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStore } from '@/src/store/useStore';
import { motion } from 'motion/react';

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
  { id: 'emails', label: 'E-mails', icon: Mail, path: '/emails' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '/documents' },
  { id: 'calendar', label: 'Calendrier', icon: Calendar, path: '/calendar' },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare, path: '/tasks' },
];

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 260 : 80 }}
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden shrink-0",
        !isSidebarOpen && "items-center"
      )}
    >
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 ai-gradient rounded-lg flex items-center justify-center text-white font-bold shrink-0">
            A
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl text-gray-900 tracking-tight whitespace-nowrap"
            >
              AI Assistant
            </motion.span>
          )}
        </div>
      </div>

      <div className="px-4 py-8 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold",
              isActive 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-card">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Statut Système</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-sm text-gray-700 font-medium">Connecté à Google</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
            isActive 
              ? "bg-gray-100 text-gray-900" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
              <Settings className="h-5 w-5 shrink-0" />
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  Paramètres
                </motion.span>
              )}
        </NavLink>
        
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium w-full text-left"
        >
          {isSidebarOpen ? (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Réduire</motion.span>
            </>
          ) : (
            <ChevronRight className="h-5 w-5 shrink-0" />
          )}
        </button>
      </div>
    </motion.aside>
  );
};

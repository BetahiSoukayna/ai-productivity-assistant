import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { useStore } from '@/src/store/useStore';

export const Header: React.FC = () => {
  const { user } = useStore();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input 
          type="text" 
          placeholder="Chercher dans vos emails..."
          className="w-full bg-gray-100 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
        />
      </div>

      <div className="flex items-center gap-6 ml-8">
        <button className="text-gray-500 hover:text-gray-900 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <button className="text-gray-500 hover:text-gray-900">
          <HelpCircle className="h-5 w-5" />
        </button>
        
        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-blue-200 text-sm">
            JD
          </div>
        </div>
      </div>
    </header>
  );
};

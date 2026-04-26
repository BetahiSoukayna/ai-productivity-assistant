import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  Trash2, 
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Reply,
  Copy,
  Send,
  Paperclip,
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { summarizeEmail } from '@/src/lib/gemini';

interface Email {
  id: string;
  sender: { name: string; email: string; avatar: string };
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  important: boolean;
  attachments?: string[];
}

const mockEmails: Email[] = [
  {
    id: '1',
    sender: { name: 'Sarah Wilson', email: 'sarah.w@corp.com', avatar: 'https://picsum.photos/seed/sarah/80/80' },
    subject: 'Planification stratégique Q2 - Brouillon final',
    preview: 'Salut Jean, j\'ai terminé le brouillon pour la stratégie Q2. Jette un œil à la roadmap en pièce jointe...',
    body: `Salut Jean,

J'ai terminé le brouillon pour la planification stratégique du deuxième trimestre (Q2). L'accent sera mis sur le passage à l'échelle de nos capacités IA et l'amélioration de la rétention client.

J'ai joint la roadmap complète pour ton examen. Fais-moi savoir ce que tu en penses d'ici jeudi soir afin que nous puissions la finaliser pour la réunion de vendredi.

Merci,
Sarah`,
    time: '09:45',
    unread: true,
    important: true,
    attachments: ['roadmap_q2.pdf']
  },
  {
    id: '2',
    sender: { name: 'Service IT', email: 'support@corp.com', avatar: 'https://picsum.photos/seed/it/80/80' },
    subject: 'Alerte de sécurité : Nouvelle connexion détectée',
    preview: 'Une nouvelle connexion a été détectée sur votre compte à partir d\'un navigateur Chrome sur Windows...',
    body: 'Une nouvelle connexion a été détectée sur votre compte à partir d\'un navigateur Chrome sur Windows. Si c\'était vous, vous pouvez ignorer cet e-mail. Sinon, veuillez réinitialiser votre mot de passe immédiatement.',
    time: 'il y a 2h',
    unread: false,
    important: false
  },
  {
    id: '3',
    sender: { name: 'Équipe Marketing', email: 'marketing@corp.com', avatar: 'https://picsum.photos/seed/market/80/80' },
    subject: 'Newsletter - Mises à jour d\'avril 2025',
    preview: 'Bienvenue dans nos mises à jour mensuelles ! Ce mois-ci, nous avons des nouvelles excitantes sur le lancement...',
    body: 'Découvrez nos dernières innovations et les mises à jour de l\'équipe dans la newsletter de ce mois-ci...',
    time: 'Hier',
    unread: false,
    important: false
  }
];

const Emails: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const selectedEmail = mockEmails.find(e => e.id === selectedId);

  const handleSummarize = async () => {
    if (!selectedEmail) return;
    setIsSummarizing(true);
    setSummary(null);
    const res = await summarizeEmail(selectedEmail.subject, selectedEmail.body);
    setSummary(res || "Échec de la génération du résumé.");
    setIsSummarizing(false);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6 overflow-hidden">
      {/* Email List */}
      <div className={cn(
        "bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col transition-all duration-500",
        selectedId ? "w-1/2" : "w-full"
      )}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Boîte de réception</h2>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button className="px-3 py-1 text-xs font-bold bg-white rounded-md shadow-sm text-blue-600">Tout</button>
              <button className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700">Non lus</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Filter className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2">
          {mockEmails.map((email) => (
            <div 
              key={email.id}
              onClick={() => {
                setSelectedId(email.id);
                setSummary(null);
              }}
              className={cn(
                "p-4 rounded-2xl cursor-pointer transition-all flex gap-4 group relative",
                selectedId === email.id ? "bg-blue-50/50" : "hover:bg-gray-50"
              )}
            >
              <img 
                src={email.sender.avatar} 
                alt={email.sender.name}
                className="h-12 w-12 rounded-full border border-gray-100 shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-bold truncate", email.unread ? "text-gray-900" : "text-gray-500")}>
                    {email.sender.name}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{email.time}</span>
                </div>
                <h4 className={cn("text-sm truncate mt-0.5", email.unread ? "font-bold text-gray-900" : "font-semibold text-gray-700")}>
                  {email.subject}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-1 mt-1">{email.preview}</p>
                
                <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-gray-400 hover:text-blue-500"><Star className="h-4 w-4" /></button>
                  <button className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  <button className="text-gray-400 hover:text-emerald-500"><CheckCircle className="h-4 w-4" /></button>
                </div>
              </div>
              {email.unread && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-full"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail / AI Summary Panel */}
      <AnimatePresence>
        {selectedId && selectedEmail && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-1/2 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <button 
                onClick={() => setSelectedId(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Fermer"
              >
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                  <Reply className="h-4 w-4" /> Répondre
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold leading-tight text-gray-900">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-4">
                  <img src={selectedEmail.sender.avatar} className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{selectedEmail.sender.name}</p>
                    <p className="text-xs text-gray-500">{selectedEmail.sender.email} • {selectedEmail.time}</p>
                  </div>
                </div>
              </div>

              {/* AI Section */}
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden group shadow-sm transition-all">
                <div className="absolute -top-3 left-4 px-3 py-1 bg-white border border-indigo-200 rounded-full text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 shadow-sm z-10">
                  ✨ Sommaire
                </div>
                
                <div className="flex items-center justify-between mb-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <span className="font-bold text-sm text-gray-900 uppercase tracking-wider">Analyse IA</span>
                  </div>
                  {!summary && !isSummarizing && (
                    <button 
                      onClick={handleSummarize}
                      className="text-xs font-bold text-indigo-600 px-3 py-1 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      Résumer
                    </button>
                  )}
                </div>

                {isSummarizing ? (
                  <div className="space-y-3 py-2">
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : summary ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-sans"
                  >
                    {summary}
                  </motion.div>
                ) : (
                  <p className="text-sm text-gray-500">Besoin d'un résumé rapide ? L'IA peut analyser cet e-mail pour vous.</p>
                )}

                {summary && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-4">
                    <button className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">
                      <Copy className="h-3.5 w-3.5" /> Copier le résumé
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">
                      <Reply className="h-3.5 w-3.5" /> Préparer une réponse
                    </button>
                  </div>
                )}
                
                <div className="absolute top-0 right-0 h-20 w-20 bg-purple-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/10 transition-colors"></div>
              </div>

              {/* Body */}
              <div className="text-gray-700 leading-relaxed text-base prose max-w-none">
                {selectedEmail.body.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>

              {/* Attachments */}
              {selectedEmail.attachments && (
                <div className="pt-8 border-t border-gray-100 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Pièces jointes ({selectedEmail.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEmail.attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <FileText className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{file}</p>
                          <p className="text-xs text-gray-500 uppercase">1.2 MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Emails;

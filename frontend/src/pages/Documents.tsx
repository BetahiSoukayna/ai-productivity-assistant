import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Send, 
  FileText, 
  File as FileIcon,
  Maximize2,
  ExternalLink,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Check
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/src/lib/utils';
import { askDriveAssistant } from '@/src/lib/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { name: string; type: 'pdf' | 'doc' | 'excel'; preview: string }[];
}

const mockSources: Message['sources'] = [
  { name: 'Objectifs_Q2_Final.pdf', type: 'pdf', preview: 'Mise à l\'échelle des capacités IA et croissance...' },
  { name: 'Roadmap_2025.docx', type: 'doc', preview: 'Jalons clés pour Q3 incluant l\'expansion...' }
];

const Documents: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA Workspace. J\'ai analysé vos fichiers Google Drive. Posez-moi n\'importe quelle question sur vos documents, comme "Quels sont nos objectifs pour le Q2 ?" ou "Résume la dernière proposition de projet".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Contexte fictif pour la démo
    const context = "Objectifs (OKRs) pour le Q2 : Augmenter la base d'utilisateurs de 20 %, Terminer l'outil de productivité IA, réduire la latence de 40 %. Sarah Wilson est la responsable de la planification stratégique.";
    
    try {
      const response = await askDriveAssistant(input, context);
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response || "Je n'ai pas pu traiter cette requête.",
        sources: input.toLowerCase().includes('okr') || input.toLowerCase().includes('objectif') ? [mockSources?.[0] as any] : []
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-8">
      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">Assistant Drive</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 font-medium">Prêt à aider</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex gap-4 max-w-4xl",
                message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                message.role === 'user' ? "bg-white border-gray-200" : "bg-indigo-600 border-indigo-700 text-white"
              )}>
                {message.role === 'user' ? <User className="h-5 w-5 text-gray-600" /> : <Bot className="h-5 w-5" />}
              </div>
              
              <div className="space-y-4">
                <div className={cn(
                  "p-5 rounded-2xl shadow-sm text-base leading-relaxed",
                  message.role === 'user' 
                    ? "bg-white border border-gray-100 text-gray-800" 
                    : "bg-gray-50 border border-gray-100 text-gray-800"
                )}>
                  <div className="prose prose-blue max-w-none prose-p:my-0 prose-ul:my-2 prose-li:my-1">
                     <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                  </div>
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {message.sources.map((source, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:border-indigo-300 transition-colors cursor-pointer group max-w-xs shadow-sm">
                        <div className="h-8 w-8 bg-indigo-50 rounded flex items-center justify-center shrink-0">
                          <FileIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{source.name}</p>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{source.preview}</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Posez une question sur vos fichiers..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none min-h-[90px] shadow-inner"
            />
            <div className="absolute right-4 bottom-4 flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Paperclip className="h-5 w-5" />
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "px-5 py-2 rounded-xl h-10 flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-95",
                  input.trim() && !isLoading 
                    ? "bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                Envoyer <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] uppercase font-bold tracking-widest text-gray-400 px-2">
            <span>Propulsé par Gemini 3.1 Pro</span>
            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
            <span>Intégré à Google Drive</span>
          </div>
        </div>
      </div>

      {/* Files Overview Sidebar */}
      <div className="w-80 space-y-6 hidden xl:block">
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-4 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> Contexte recommandé
          </h3>
          <div className="space-y-4">
            {['Strategie_Q3.pdf', 'Budget_Tableau.xlsx', 'Equipe_Objectifs.doc'].map((file, i) => (
              <div key={i} className="flex items-center gap-3 group cursor-pointer">
                <div className="h-9 w-9 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <FileText className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate group-hover:text-indigo-600 transition-colors">{file}</p>
                  <p className="text-[10px] text-gray-400">Haute pertinence</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
            Gérer l'indexation
          </button>
        </section>

        <section className="ai-gradient rounded-2xl p-6 text-white shadow-deep relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-xs font-bold mb-1">Posez une question à Drive</h4>
            <p className="text-[10px] opacity-90 mb-3 leading-relaxed">
              Demandez ce que vous voulez sur vos documents. Je scannerai vos fichiers pour trouver la réponse.
            </p>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ex: Quels sont les OKR?" 
                className="w-full bg-white/20 border-white/30 border text-[10px] py-1.5 px-3 rounded-lg placeholder:text-white/60 focus:outline-none focus:bg-white/30 transition-all font-sans"
              />
              <div className="absolute right-2 top-1.5">
                <Send className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        </section>
      </div>
    </div>
  );
};

export default Documents;

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  getGmailEmails,
  getGmailEmailDetail,
  summarizeGmailEmail,
  detectGmailEmailImportance,
  suggestGmailEmailReply,
  addGmailEmailToMemory,
} from "../services/api";

type GmailEmail = {
  id: string;
  thread_id?: string;
  subject: string;
  sender: string;
  date: string;
  snippet: string;
};

type EmailDetail = {
  id: string;
  thread_id?: string;
  subject: string;
  sender: string;
  date: string;
  snippet?: string;
  body?: string;
};

function senderName(sender: string) {
  if (!sender) return "Inconnu";
  const match = sender.match(/^(.*?)\s*</);
  return match ? match[1].trim() || "Inconnu" : sender;
}

function senderEmail(sender: string) {
  if (!sender) return "";
  const match = sender.match(/<([^>]+)>/);
  return match ? match[1] : sender;
}

function firstLetter(sender: string) {
  return senderName(sender).charAt(0).toUpperCase() || "U";
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export default function Emails() {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);

  const [query, setQuery] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [memoryResult, setMemoryResult] = useState("");
  const [error, setError] = useState("");

  const loadEmails = async () => {
    setLoadingEmails(true);
    setError("");

    try {
      const res = await getGmailEmails(30, query);
      setEmails(res.emails || []);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger la boîte Gmail.");
    } finally {
      setLoadingEmails(false);
    }
  };

  const openEmail = async (id: string) => {
    setLoadingDetail(true);
    setError("");
    setAiResult("");
    setMemoryResult("");

    try {
      const res = await getGmailEmailDetail(id);
      setSelectedEmail(res.email);
    } catch (err) {
      console.error(err);
      setError("Impossible d’ouvrir cet email.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedEmail) return;
    setActionLoading("summary");
    setAiResult("");
    setError("");

    try {
      const res = await summarizeGmailEmail(selectedEmail.id);
      setAiResult(res.summary || JSON.stringify(res, null, 2));
    } catch {
      setError("Erreur lors du résumé de l’email.");
    } finally {
      setActionLoading("");
    }
  };

  const handleReply = async () => {
    if (!selectedEmail) return;
    setActionLoading("reply");
    setAiResult("");
    setError("");

    try {
      const res = await suggestGmailEmailReply(selectedEmail.id);
      setAiResult(res.suggested_reply || JSON.stringify(res, null, 2));
    } catch {
      setError("Erreur lors de la suggestion de réponse.");
    } finally {
      setActionLoading("");
    }
  };

  const handleImportance = async () => {
    if (!selectedEmail) return;
    setActionLoading("importance");
    setAiResult("");
    setError("");

    try {
      const res = await detectGmailEmailImportance(selectedEmail.id);
      setAiResult(res.result || JSON.stringify(res, null, 2));
    } catch {
      setError("Erreur lors de l’analyse d’importance.");
    } finally {
      setActionLoading("");
    }
  };

  const handleAddToMemory = async () => {
    if (!selectedEmail) return;

    const ok = window.confirm(
      "Ajouter cet email à la mémoire IA ? Il sera indexé dans ChromaDB et utilisé par le Chat RAG."
    );

    if (!ok) return;

    setActionLoading("memory");
    setMemoryResult("");
    setError("");

    try {
      const res = await addGmailEmailToMemory(selectedEmail.id, "test_user");
      setMemoryResult(
        `Email ajouté à la mémoire IA. Chunks indexés : ${res.indexed}`
      );
    } catch {
      setError("Erreur lors de l’ajout à la mémoire IA.");
    } finally {
      setActionLoading("");
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const sanitizedBody = useMemo(() => {
    const raw = selectedEmail?.body || selectedEmail?.snippet || "";
    if (!raw) return "";

    if (isHtml(raw)) {
      return DOMPurify.sanitize(raw);
    }

    return DOMPurify.sanitize(raw.replace(/\n/g, "<br/>"));
  }, [selectedEmail]);

  return (
    <div className="h-[calc(100vh-72px)] overflow-hidden bg-[#f6f8fc]">
      <div className="grid h-full grid-cols-[360px_minmax(0,1fr)_340px]">
        {/* Left: Gmail list */}
        <section className="flex h-full flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Boîte Gmail</h1>
                <p className="text-xs text-slate-500">
                  {emails.length} message(s) chargés
                </p>
              </div>

              <button
                onClick={loadEmails}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
              >
                ↻
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadEmails();
                }}
                placeholder='Rechercher : from:, subject:, "stage"...'
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {error && (
            <div className="m-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loadingEmails && (
              <div className="p-4 text-sm text-slate-500">Chargement...</div>
            )}

            {!loadingEmails && emails.length === 0 && (
              <div className="p-4 text-sm text-slate-500">
                Aucun email trouvé.
              </div>
            )}

            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => openEmail(email.id)}
                className={`w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                  selectedEmail?.id === email.id
                    ? "border-l-4 border-l-blue-600 bg-blue-50"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {firstLetter(email.sender)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {senderName(email.sender)}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatDate(email.date)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm font-medium text-slate-700">
                      {email.subject || "Sans sujet"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {email.snippet}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Center: email reading */}
        <section className="h-full overflow-y-auto bg-[#f6f8fc]">
          {!selectedEmail && !loadingDetail && (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  ✉
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sélectionnez un email
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Le contenu s’affichera ici, comme une vraie boîte Gmail.
                </p>
              </div>
            </div>
          )}

          {loadingDetail && (
            <div className="p-8 text-sm text-slate-500">
              Ouverture de l’email...
            </div>
          )}

          {!loadingDetail && selectedEmail && (
            <div className="mx-auto max-w-5xl px-8 py-6">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-8 py-6">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {selectedEmail.subject || "Sans sujet"}
                  </h2>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {firstLetter(selectedEmail.sender)}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {senderName(selectedEmail.sender)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {senderEmail(selectedEmail.sender)}
                      </p>
                    </div>

                    <div className="ml-auto text-sm text-slate-400">
                      {formatDate(selectedEmail.date)}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={handleSummarize}
                      disabled={!!actionLoading}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionLoading === "summary" ? "Résumé..." : "Résumer"}
                    </button>

                    <button
                      onClick={handleReply}
                      disabled={!!actionLoading}
                      className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                      {actionLoading === "reply" ? "Génération..." : "Suggérer réponse"}
                    </button>

                    <button
                      onClick={handleImportance}
                      disabled={!!actionLoading}
                      className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                    >
                      {actionLoading === "importance" ? "Analyse..." : "Importance"}
                    </button>

                    <button
                      onClick={handleAddToMemory}
                      disabled={!!actionLoading}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {actionLoading === "memory"
                        ? "Indexation..."
                        : "Ajouter à la mémoire IA"}
                    </button>
                  </div>
                </div>

                {memoryResult && (
                  <div className="mx-8 mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {memoryResult}
                  </div>
                )}

                {aiResult && (
                  <div className="mx-8 mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <h3 className="font-bold text-blue-900">Résultat IA</h3>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-blue-950">
                      {aiResult}
                    </div>
                  </div>
                )}

                <article className="px-8 py-8">
                  <div
                    className="email-content mx-auto max-w-3xl text-[15px] leading-8 text-slate-800"
                    dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                  />
                </article>
              </div>
            </div>
          )}
        </section>

        {/* Right: AI panel */}
        <aside className="hidden h-full overflow-y-auto border-l border-slate-200 bg-white xl:block">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">Assistant IA</h2>
            <p className="mt-1 text-sm text-slate-500">
              Actions rapides liées à l’email sélectionné.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-white shadow-lg">
              <h3 className="text-lg font-bold">Mémoire intelligente</h3>
              <p className="mt-2 text-sm text-blue-50">
                Les emails ne sont ajoutés à ChromaDB qu’après validation de l’utilisateur.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Flux RAG</h3>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li>1. Lire l’email via Gmail API</li>
                <li>2. Cliquer “Ajouter à la mémoire IA”</li>
                <li>3. Chunking + indexation ChromaDB</li>
                <li>4. Question dans le Chat RAG</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">État</h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Gmail connecté
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                ChromaDB actif
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
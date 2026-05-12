import { useState } from "react";
import { askRag, healthCheck } from "../services/api";

type RagSource = {
  filename?: string;
  source?: string;
  type?: string;
  content_type?: string;
  score?: number;
  confidence?: number;
};

export default function Dashboard() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<RagSource[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [typeDetected, setTypeDetected] = useState("");
  const [backendStatus, setBackendStatus] = useState("Non vérifié");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleHealthCheck = async () => {
    setChecking(true);
    setError("");

    try {
      const res = await healthCheck();
      setBackendStatus(res.status || "ok");
    } catch (err) {
      console.error(err);
      setBackendStatus("Hors ligne");
      setError("Impossible de contacter le backend FastAPI.");
    } finally {
      setChecking(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("Veuillez écrire une question.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    setConfidence(null);
    setTypeDetected("");

    try {
      const res = await askRag(question, "test_user");

      setAnswer(res.answer || res.response || res.result || "Aucune réponse reçue.");
      setSources(res.sources || []);
      setConfidence(
        typeof res.confidence === "number" ? res.confidence : null
      );
      setTypeDetected(res.type_detected || res.type || "");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l’appel au système RAG.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleAsk();
    }
  };

  const formatScore = (value?: number) => {
    if (value === undefined || value === null) return "";
    if (value <= 1) return `${Math.round(value * 100)}%`;
    return `${Math.round(value)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">
          AI Productivity Assistant
        </h1>
        <p className="text-gray-600 mt-1">
          Assistant RAG connecté à ChromaDB pour interroger les données indexées
          depuis Gmail, Drive ou des fichiers locaux.
        </p>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              État du backend
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Statut :{" "}
              <span
                className={
                  backendStatus === "ok"
                    ? "font-semibold text-green-600"
                    : backendStatus === "Hors ligne"
                    ? "font-semibold text-red-600"
                    : "font-semibold text-gray-700"
                }
              >
                {backendStatus}
              </span>
            </p>
          </div>

          <button
            onClick={handleHealthCheck}
            disabled={checking}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {checking ? "Vérification..." : "Vérifier API"}
          </button>
        </div>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Chat RAG global
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Pose une question sur les documents déjà indexés dans ChromaDB.
          </p>
        </div>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleEnterSubmit}
          placeholder="Exemple : Quel est l'objectif du projet AI Productivity Assistant ?"
          className="w-full min-h-[130px] border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleAsk}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Réflexion en cours..." : "Demander"}
          </button>

          <span className="text-xs text-gray-500">
            Astuce : Ctrl + Entrée pour envoyer
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {answer && (
          <div className="p-4 rounded-lg bg-gray-50 border space-y-3">
            <h3 className="font-semibold text-gray-900">Réponse</h3>

            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {answer}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600 pt-2">
              {confidence !== null && (
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                  Confiance : {formatScore(confidence)}
                </span>
              )}

              {typeDetected && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  Type détecté : {typeDetected}
                </span>
              )}
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-semibold text-gray-900 mb-3">
              Sources consultées
            </h3>

            <ul className="space-y-2">
              {sources.map((src, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-700 border-b last:border-b-0 pb-2"
                >
                  <div className="font-medium">
                    {src.filename || src.source || `Source ${index + 1}`}
                  </div>

                  <div className="text-gray-500">
                    {(src.type || src.content_type) && (
                      <span>Type : {src.type || src.content_type}</span>
                    )}

                    {(src.score !== undefined ||
                      src.confidence !== undefined) && (
                      <span>
                        {" "}
                        — Score :{" "}
                        {formatScore(src.score ?? src.confidence)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
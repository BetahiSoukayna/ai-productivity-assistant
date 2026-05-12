import { useState } from "react";
import { ingestFile } from "../services/api";

export default function Documents() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("manual_upload");
  const [userId, setUserId] = useState("test_user");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await ingestFile(file, {
        user_id: userId,
        source,
      });

      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l’indexation du fichier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f6f8fc] px-8 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Sources IA</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Cette page gère les sources qui peuvent alimenter la mémoire RAG :
            pièces jointes Gmail, fichiers Google Drive et upload manuel pour test.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              ✉
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Pièces jointes Gmail
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Les documents reçus par email doivent être indexés après validation
              utilisateur depuis la page E-mails.
            </p>
            <button
              disabled
              className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
            >
              Géré depuis E-mails
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
              ⬢
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Google Drive
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Prochaine étape : afficher les fichiers Drive et ajouter chaque
              document à ChromaDB après confirmation.
            </p>
            <button
              disabled
              className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
            >
              À connecter ensuite
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
              ⬆
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Upload manuel
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Utilisé seulement pour tester rapidement le pipeline RAG.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Test manuel d’indexation
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cette partie restera utile pour démo, mais dans la vraie app les fichiers
            viendront surtout de Gmail et Drive.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Fichier à indexer
              </label>
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx,.xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                User ID
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Source
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Indexation..." : "Indexer le fichier"}
            </button>

            {file && (
              <span className="text-sm text-slate-500">
                Fichier : <strong>{file.name}</strong>
              </span>
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
              <h3 className="font-bold text-green-800">Indexation terminée</h3>
              <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-white p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
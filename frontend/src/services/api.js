import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Poser une question au système RAG.
 */
export async function askRag(question, userId = "test_user") {
  try {
    const res = await axios.post(`${API_URL}/ask`, {
      question,
      user_id: userId,
    });

    return res.data;
  } catch (error) {
    console.error("Erreur askRag :", error);
    throw error;
  }
}

/**
 * Vérifier que le backend est en ligne.
 */
export async function healthCheck() {
  try {
    const res = await axios.get(`${API_URL}/health`);
    return res.data;
  } catch (error) {
    console.error("Erreur healthCheck :", error);
    throw error;
  }
}

/**
 * Uploader et indexer un fichier dans ChromaDB.
 */
export async function ingestFile(file, metadata = {}) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    const res = await axios.post(`${API_URL}/ingest`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.error("Erreur ingestFile :", error);
    throw error;
  }
}

export default {
  askRag,
  healthCheck,
  ingestFile,
};
/**
 * Récupérer la liste des emails Gmail.
 */
export async function getGmailEmails(maxResults = 20, query = "") {
  try {
    const res = await axios.get(`${API_URL}/gmail/emails`, {
      params: {
        max_results: maxResults,
        query: query || undefined,
      },
    });

    return res.data;
  } catch (error) {
    console.error("Erreur getGmailEmails :", error);
    throw error;
  }
}

/**
 * Récupérer le détail d'un email Gmail.
 */
export async function getGmailEmailDetail(messageId) {
  try {
    const res = await axios.get(`${API_URL}/gmail/emails/${messageId}`);
    return res.data;
  } catch (error) {
    console.error("Erreur getGmailEmailDetail :", error);
    throw error;
  }
}

/**
 * Résumer un email Gmail.
 */
export async function summarizeGmailEmail(messageId) {
  try {
    const res = await axios.post(`${API_URL}/gmail/emails/${messageId}/summarize`);
    return res.data;
  } catch (error) {
    console.error("Erreur summarizeGmailEmail :", error);
    throw error;
  }
}

/**
 * Détecter l'importance d'un email Gmail.
 */
export async function detectGmailEmailImportance(messageId) {
  try {
    const res = await axios.post(`${API_URL}/gmail/emails/${messageId}/importance`);
    return res.data;
  } catch (error) {
    console.error("Erreur detectGmailEmailImportance :", error);
    throw error;
  }
}

/**
 * Suggérer une réponse à un email Gmail.
 */
export async function suggestGmailEmailReply(messageId) {
  try {
    const res = await axios.post(`${API_URL}/gmail/emails/${messageId}/suggest-reply`);
    return res.data;
  } catch (error) {
    console.error("Erreur suggestGmailEmailReply :", error);
    throw error;
  }
}

/**
 * Ajouter un email Gmail à la mémoire IA ChromaDB.
 */
export async function addGmailEmailToMemory(messageId, userId = "test_user") {
  try {
    const res = await axios.post(`${API_URL}/gmail/emails/${messageId}/add-to-memory`, {
      user_id: userId,
    });

    return res.data;
  } catch (error) {
    console.error("Erreur addGmailEmailToMemory :", error);
    throw error;
  }
}
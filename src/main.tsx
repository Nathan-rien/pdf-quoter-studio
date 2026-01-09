import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Validation du cache au démarrage pour éviter les erreurs DOM
const validateCache = () => {
  try {
    const templateStorage = localStorage.getItem('template-editor-storage');
    if (templateStorage) {
      const parsed = JSON.parse(templateStorage);
      if (!parsed.state || typeof parsed.state !== 'object') {
        console.warn('Cache template corrompu, nettoyage...');
        localStorage.removeItem('template-editor-storage');
      }
    }
  } catch (e) {
    console.error('Erreur validation cache:', e);
    localStorage.removeItem('template-editor-storage');
    localStorage.removeItem('rental-proposal-storage');
  }
};

validateCache();

createRoot(document.getElementById("root")!).render(<App />);

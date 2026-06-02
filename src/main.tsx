import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Validation isolée du cache au démarrage.
// IMPORTANT : on ne touche JAMAIS à `rental-proposal-storage` ici.
// Le travail utilisateur en cours ne doit pas être effacé à cause d'un
// problème de parsing sur un autre store.
const validateCache = () => {
  const safeValidate = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !("state" in parsed)) {
        console.warn(`Cache "${key}" corrompu, nettoyage isolé...`);
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error(`Erreur validation cache "${key}":`, e);
      localStorage.removeItem(key);
    }
  };

  // Ne valider que les stores techniques. Les données utilisateur
  // (rental-proposal-storage) sont préservées coûte que coûte.
  safeValidate("template-editor-storage");
};

validateCache();

createRoot(document.getElementById("root")!).render(<App />);

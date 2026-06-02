import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * Garde-fou DOM contre les mutations externes (extensions navigateur,
 * traducteurs intégrés type Google Translate / Edge Translate, etc.).
 *
 * Ces outils déplacent ou suppriment des nœuds DOM hors du contrôle de React,
 * provoquant des erreurs `Failed to execute 'removeChild'/'insertBefore' on 'Node'`
 * qui font crasher l'application et déclenchent l'ErrorBoundary.
 *
 * On patche `removeChild` et `insertBefore` pour ignorer silencieusement les
 * opérations sur des nœuds dont le parent ne correspond plus, plutôt que de
 * laisser l'exception remonter.
 *
 * Référence : https://github.com/facebook/react/issues/11538
 */
const installDomGuards = () => {
  if (typeof Node === "function" && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        console.warn(
          "[DOM Guard] removeChild ignoré : nœud déjà détaché (probablement une extension navigateur)."
        );
        return child;
      }
      return originalRemoveChild.apply(this, [child] as any) as T;
    } as typeof Node.prototype.removeChild;

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        console.warn(
          "[DOM Guard] insertBefore ignoré : référence orpheline (probablement une extension navigateur)."
        );
        return newNode;
      }
      return originalInsertBefore.apply(this, [newNode, referenceNode] as any) as T;
    } as typeof Node.prototype.insertBefore;
  }
};

installDomGuards();

// Validation isolée du cache au démarrage.
// IMPORTANT : on ne touche JAMAIS à `rental-proposal-storage` ici.
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

  safeValidate("template-editor-storage");
};

validateCache();

const rootEl = document.getElementById("root")!;
// Renforce la protection anti-traduction sur le conteneur React lui-même.
rootEl.setAttribute("translate", "no");
rootEl.classList.add("notranslate");

createRoot(rootEl).render(<App />);

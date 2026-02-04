/**
 * Éditeur de texte inline sur le canvas
 * Utilise contentEditable pour permettre l'édition directe
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { ALLOWED_FONTS } from "@/lib/template-styles";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { TextContent, TextAlign } from "@/types/template-editor";

interface InlineTextEditorProps {
  content: TextContent;
  onContentChange: (html: string, plainText: string) => void;
  onExit: () => void;
  style?: React.CSSProperties;
}

export function InlineTextEditor({
  content,
  onContentChange,
  onExit,
  style,
}: InlineTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef<string>("");
  const [isActive, setIsActive] = useState(false);

  // Initialiser le contenu avec un délai pour éviter le blur immédiat
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      try {
        if (editorRef.current) {
          // Sanitize HTML content when initializing
          const htmlContent = sanitizeHtml(content.htmlContent || content.text);
          editorRef.current.innerHTML = htmlContent;
          initialContentRef.current = htmlContent;
          
          // Focus et placer le curseur à la fin
          editorRef.current.focus();
          
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          // Marquer comme actif après initialisation
          setIsActive(true);
        }
      } catch (domError) {
        console.error('Error initializing inline editor:', domError);
        onExit();
      }
    }, 50);

    return () => clearTimeout(initTimeout);
  }, []);

  // Gérer les changements de contenu avec sanitization
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const rawHtml = editorRef.current.innerHTML;
      const html = sanitizeHtml(rawHtml);
      const plainText = editorRef.current.innerText || editorRef.current.textContent || "";
      onContentChange(html, plainText);
    }
  }, [onContentChange]);

  // Gérer les raccourcis clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // IMPORTANT: Stopper la propagation pour TOUTES les touches
    // Empêche le canvas de capturer Delete/Backspace/Arrows/etc.
    e.stopPropagation();

    // Échap pour annuler et sortir
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContentRef.current;
      }
      onExit();
      return;
    }
    
    // Ctrl+Enter pour confirmer
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onExit();
      return;
    }

    // Formatage avec raccourcis
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false);
          handleInput();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false);
          handleInput();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false);
          handleInput();
          break;
      }
    }
  }, [onExit, handleInput]);

  // Gérer le blur avec vérification et synchronisation DOM
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Ne pas fermer si pas encore actif (initialisation en cours)
    if (!isActive) return;
    
    // Vérifier immédiatement si le focus va vers un élément de la toolbar
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('[data-floating-toolbar]')) {
      // Refocus l'éditeur après interaction avec la toolbar
      setTimeout(() => editorRef.current?.focus(), 10);
      return;
    }

    // Délai plus long avec requestAnimationFrame pour synchroniser avec React
    const exitTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        const isToolbarElement = activeElement?.closest('[data-floating-toolbar]');
        if (!isToolbarElement) {
          onExit();
        }
      });
    }, 150);
    
    return () => clearTimeout(exitTimeout);
  }, [isActive, onExit]);

  // Style du texte
  const fontFamily = ALLOWED_FONTS.find(f => f.name === content.fontFamily)?.value || content.fontFamily;

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className="w-full h-full outline-none cursor-text whitespace-pre-wrap break-words"
      style={{
        fontFamily,
        fontSize: `${Math.max(content.fontSize * 0.4, 6)}px`,
        color: content.color,
        fontWeight: content.bold ? 'bold' : 'normal',
        fontStyle: content.italic ? 'italic' : 'normal',
        textDecoration: content.underline ? 'underline' : 'none',
        lineHeight: 1.2,
        textAlign: (content.textAlign || 'left') as TextAlign,
        padding: '2px 4px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 0 0 2px hsl(var(--primary))',
        borderRadius: '2px',
        minHeight: '1.2em',
        ...style,
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}

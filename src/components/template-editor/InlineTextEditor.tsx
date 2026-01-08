/**
 * Éditeur de texte inline sur le canvas
 * Utilise contentEditable pour permettre l'édition directe
 */

import { useRef, useEffect, useCallback } from "react";
import { ALLOWED_FONTS } from "@/lib/template-styles";
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

  // Initialiser le contenu
  useEffect(() => {
    if (editorRef.current) {
      const htmlContent = content.htmlContent || content.text;
      editorRef.current.innerHTML = htmlContent;
      initialContentRef.current = htmlContent;
      
      // Focus et sélectionner tout le texte
      editorRef.current.focus();
      
      // Placer le curseur à la fin
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  // Gérer les changements de contenu
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const plainText = editorRef.current.innerText || editorRef.current.textContent || "";
      onContentChange(html, plainText);
    }
  }, [onContentChange]);

  // Gérer les raccourcis clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      onBlur={() => {
        // Petit délai pour permettre aux boutons de la toolbar de fonctionner
        setTimeout(() => {
          // Vérifier si le focus est passé à un élément de la toolbar
          const activeElement = document.activeElement;
          const isToolbarElement = activeElement?.closest('[data-floating-toolbar]');
          if (!isToolbarElement) {
            onExit();
          }
        }, 100);
      }}
    />
  );
}

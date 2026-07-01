/**
 * Éditeur de texte inline sur le canvas
 * Utilise contentEditable pour permettre l'édition directe
 * Mode "draft local" : les changements restent dans le DOM local
 * et ne sont committés dans le store qu'au blur/confirm.
 */

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import { ALLOWED_FONTS } from "@/lib/template-styles";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { TextContent, TextAlign } from "@/types/template-editor";

/** Imperative API exposed to the parent (EditorCanvas / FloatingToolbar) */
export interface InlineTextEditorHandle {
  execFormat: (command: string, value?: string) => void;
  getHtml: () => string;
  getPlainText: () => string;
  focus: () => void;
  commit: () => void;
  cancel: () => void;
}

interface InlineTextEditorProps {
  content: TextContent;
  /** Called once when the user confirms (blur / Ctrl+Enter / toolbar ✓) */
  onCommit: (html: string, plainText: string) => void;
  /** Called when the user cancels (Escape / toolbar ✗) */
  onExit: () => void;
  style?: React.CSSProperties;
}

export const InlineTextEditor = forwardRef<InlineTextEditorHandle, InlineTextEditorProps>(
  function InlineTextEditor({ content, onCommit, onExit, style }, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const initialContentRef = useRef<string>("");
    const [isActive, setIsActive] = useState(false);
    const committedRef = useRef(false);

    // --- Imperative API ---
    useImperativeHandle(ref, () => ({
      execFormat(command: string, value?: string) {
        editorRef.current?.focus();
        // Restore selection inside the editor if needed
        const sel = window.getSelection();
        if (sel && editorRef.current && !editorRef.current.contains(sel.anchorNode)) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        document.execCommand(command, false, value);
      },
      getHtml() {
        return sanitizeHtml(editorRef.current?.innerHTML ?? "");
      },
      getPlainText() {
        return editorRef.current?.innerText ?? "";
      },
      focus() {
        editorRef.current?.focus();
      },
      commit() {
        doCommit();
      },
      cancel() {
        doCancel();
      },
    }));

    const doCommit = useCallback(() => {
      if (committedRef.current) return;
      committedRef.current = true;
      if (editorRef.current) {
        const html = sanitizeHtml(editorRef.current.innerHTML);
        const plainText = editorRef.current.innerText || "";
        onCommit(html, plainText);
      }
      onExit();
    }, [onCommit, onExit]);

    const doCancel = useCallback(() => {
      if (committedRef.current) return;
      committedRef.current = true;
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContentRef.current;
      }
      onExit();
    }, [onExit]);

    // --- Initialization ---
    useEffect(() => {
      const initTimeout = setTimeout(() => {
        try {
          if (editorRef.current) {
            const htmlContent = sanitizeHtml(content.htmlContent || content.text);
            editorRef.current.innerHTML = htmlContent;
            initialContentRef.current = htmlContent;

            editorRef.current.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);

            setIsActive(true);
          }
        } catch (domError) {
          console.error("Error initializing inline editor:", domError);
          onExit();
        }
      }, 50);

      return () => clearTimeout(initTimeout);
    }, []); // mount only

    // --- Keyboard shortcuts ---
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        // Stop propagation for ALL keys – keep canvas from capturing events
        e.stopPropagation();

        if (e.key === "Escape") {
          e.preventDefault();
          doCancel();
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          doCommit();
          return;
        }

        // Inline formatting shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case "b":
              e.preventDefault();
              document.execCommand("bold", false);
              break;
            case "i":
              e.preventDefault();
              document.execCommand("italic", false);
              break;
            case "u":
              e.preventDefault();
              document.execCommand("underline", false);
              break;
          }
        }
      },
      [doCommit, doCancel]
    );

    // --- Blur handling ---
    const handleBlur = useCallback(
      (e: React.FocusEvent) => {
        if (!isActive) return;

        const relatedTarget = e.relatedTarget as HTMLElement | null;
        if (relatedTarget?.closest("[data-floating-toolbar]")) {
          setTimeout(() => editorRef.current?.focus(), 10);
          return;
        }

        const exitTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            const activeElement = document.activeElement;
            if (!activeElement?.closest("[data-floating-toolbar]")) {
              doCommit();
            }
          });
        }, 150);

        return () => clearTimeout(exitTimeout);
      },
      [isActive, doCommit]
    );

    // Style
    const fontFamily =
      ALLOWED_FONTS.find((f) => f.name === content.fontFamily)?.value ||
      content.fontFamily;

    return (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="rich-text w-full h-full outline-none cursor-text whitespace-pre-wrap break-words"
        style={{
          fontFamily,
          fontSize: `${Math.max(content.fontSize * 0.4, 6)}px`,
          color: content.color,
          fontWeight: content.bold ? "bold" : "normal",
          fontStyle: content.italic ? "italic" : "normal",
          textDecoration: content.underline ? "underline" : "none",
          lineHeight: 1.2,
          textAlign: (content.textAlign || "left") as TextAlign,
          padding: "2px 4px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 0 0 2px hsl(var(--primary))",
          borderRadius: "2px",
          minHeight: "1.2em",
          ...style,
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onMouseDown={(e) => e.stopPropagation()}
        onPaste={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const cd = e.clipboardData;
          if (!cd) return;
          const html = cd.getData("text/html");
          const plain = cd.getData("text/plain");
          editorRef.current?.focus();
          if (html && html.trim()) {
            const clean = sanitizeHtml(html);
            if (clean) {
              document.execCommand("insertHTML", false, clean);
              return;
            }
          }
          if (plain) {
            document.execCommand("insertText", false, plain);
          }
        }}
      />
    );
  }
);

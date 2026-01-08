/**
 * Rich Text Editor pour mise en forme partielle du texte
 * Permet de mettre en gras/italique/souligné juste un mot
 */

import { DefaultEditor, BtnBold, BtnItalic, BtnUnderline, EditorProvider, Toolbar } from "react-simple-wysiwyg";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Saisissez le texte...",
  className,
  fontFamily = "DM Sans",
  fontSize = 12,
  color = "#1a1a1a"
}: RichTextEditorProps) {
  return (
    <div 
      className={cn(
        "rich-text-editor rounded-md border border-input bg-background",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <EditorProvider>
        <DefaultEditor
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            color,
            minHeight: '100px',
            padding: '8px 12px',
            lineHeight: '1.5',
          }}
          containerProps={{
            style: {
              resize: 'vertical',
              overflow: 'auto',
            }
          }}
        >
          <Toolbar className="flex items-center gap-1 p-2 border-b border-input bg-muted/30">
            <BtnBold className="px-2 py-1 rounded hover:bg-accent text-sm font-bold" />
            <BtnItalic className="px-2 py-1 rounded hover:bg-accent text-sm italic" />
            <BtnUnderline className="px-2 py-1 rounded hover:bg-accent text-sm underline" />
          </Toolbar>
        </DefaultEditor>
      </EditorProvider>
      <style>{`
        .rich-text-editor .rsw-editor {
          background: transparent;
          border: none;
          min-height: 100px;
        }
        .rich-text-editor .rsw-ce {
          min-height: 80px;
          outline: none;
        }
        .rich-text-editor .rsw-ce:focus {
          outline: none;
        }
        .rich-text-editor .rsw-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
        }
        .rich-text-editor .rsw-btn:hover {
          background: hsl(var(--accent));
        }
        .rich-text-editor .rsw-btn[data-active="true"] {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
      `}</style>
    </div>
  );
}

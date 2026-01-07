import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SubItemEditorProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export function SubItemEditor({ 
  value, 
  onChange, 
  onDelete,
}: SubItemEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue.trim() !== value) {
      onChange(localValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 group pl-6">
      <span className="text-muted-foreground text-xs">-</span>
      {isEditing ? (
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 h-7 text-xs"
          autoFocus
        />
      ) : (
        <span 
          className="flex-1 text-xs text-muted-foreground cursor-text hover:bg-muted/50 px-2 py-1 rounded"
          onClick={() => setIsEditing(true)}
        >
          {value}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

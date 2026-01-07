import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";

interface ServiceItemEditorProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function ServiceItemEditor({ 
  value, 
  onChange, 
  onDelete,
  canDelete 
}: ServiceItemEditorProps) {
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
    <div className="flex items-center gap-2 group">
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-grab" />
      <span className="text-muted-foreground">•</span>
      {isEditing ? (
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8 text-sm"
          autoFocus
        />
      ) : (
        <span 
          className="flex-1 text-sm cursor-text hover:bg-muted/50 px-2 py-1 rounded"
          onClick={() => setIsEditing(true)}
        >
          {value}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={!canDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

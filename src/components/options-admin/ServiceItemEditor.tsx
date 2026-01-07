import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { SubItemEditor } from "./SubItemEditor";
import { ServiceItem } from "@/types/options-admin";

interface ServiceItemEditorProps {
  service: ServiceItem;
  onChange: (text: string) => void;
  onDelete: () => void;
  canDelete: boolean;
  onAddSubItem: () => void;
  onUpdateSubItem: (subItemIndex: number, value: string) => void;
  onDeleteSubItem: (subItemIndex: number) => void;
}

export function ServiceItemEditor({ 
  service, 
  onChange, 
  onDelete,
  canDelete,
  onAddSubItem,
  onUpdateSubItem,
  onDeleteSubItem,
}: ServiceItemEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(service.text);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue.trim() !== service.text) {
      onChange(localValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(service.text);
      setIsEditing(false);
    }
  };

  const hasSubItems = service.subItems && service.subItems.length > 0;

  return (
    <div className="space-y-1">
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
            {service.text}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 opacity-0 group-hover:opacity-100 text-xs text-muted-foreground"
          onClick={onAddSubItem}
        >
          <Plus className="h-3 w-3 mr-1" />
          Précision
        </Button>
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
      
      {/* Sous-items */}
      {hasSubItems && (
        <div className="space-y-1 ml-6">
          {service.subItems!.map((subItem, index) => (
            <SubItemEditor
              key={index}
              value={subItem}
              onChange={(value) => onUpdateSubItem(index, value)}
              onDelete={() => onDeleteSubItem(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

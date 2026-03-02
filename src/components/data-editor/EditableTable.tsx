import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  type: 'text' | 'number' | 'readonly';
  width?: string;
  placeholder?: string;
  required?: boolean;
}

interface EditableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onCellChange: (rowIndex: number, column: keyof T, value: unknown) => void;
  onAddRow: () => void;
  onDeleteRow: (rowIndex: number) => void;
  canAddRows?: boolean;
  canDeleteRows?: boolean;
  errors?: { rowIndex: number; column: string; message: string }[];
  emptyMessage?: string;
}

export function EditableTable<T>({
  data,
  columns,
  onCellChange,
  onAddRow,
  onDeleteRow,
  canAddRows = true,
  canDeleteRows = true,
  errors = [],
  emptyMessage = "Aucune donnée. Cliquez sur 'Ajouter une ligne' pour commencer.",
}: EditableTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: keyof T } | null>(null);

  const getCellError = useCallback((rowIndex: number, column: keyof T) => {
    return errors.find(e => e.rowIndex === rowIndex && e.column === String(column));
  }, [errors]);

  const handleCellClick = (rowIndex: number, column: keyof T, type: string) => {
    if (type !== 'readonly') {
      setEditingCell({ row: rowIndex, col: column });
    }
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleCellChange = (rowIndex: number, column: keyof T, value: string, type: string) => {
    let parsedValue: unknown = value;
    
    if (type === 'number') {
      const num = parseFloat(value);
      parsedValue = isNaN(num) ? null : num;
    }
    
    onCellChange(rowIndex, column, parsedValue);
  };

  const isEditing = (rowIndex: number, column: keyof T) => {
    return editingCell?.row === rowIndex && editingCell?.col === column;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center font-mono text-xs">#</TableHead>
              {columns.map((col) => (
                <TableHead 
                  key={String(col.key)} 
                  style={{ width: col.width }}
                  className="font-semibold"
                >
                  {col.header}
                  {col.required && <span className="text-destructive ml-1">*</span>}
                </TableHead>
              ))}
              {canDeleteRows && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (canDeleteRows ? 2 : 1)} 
                  className="text-center text-muted-foreground py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/30">
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {rowIndex + 1}
                  </TableCell>
                  {columns.map((col) => {
                    const cellError = getCellError(rowIndex, col.key);
                    const value = row[col.key];
                    // Formater les nombres readonly à 2 décimales
                    const displayValue = value === null || value === undefined 
                      ? '' 
                      : (col.type === 'readonly' && typeof value === 'number')
                        ? value.toFixed(2)
                        : String(value);

                    return (
                      <TableCell 
                        key={String(col.key)}
                        className={cn(
                          "p-0",
                          cellError && "bg-destructive/10"
                        )}
                        onClick={() => handleCellClick(rowIndex, col.key, col.type)}
                      >
                        {col.type === 'readonly' ? (
                          <div className="px-3 py-2 text-muted-foreground bg-muted/30">
                            {displayValue}
                          </div>
                        ) : isEditing(rowIndex, col.key) ? (
                          <Input
                            autoFocus
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={displayValue}
                            onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value, col.type)}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                handleCellBlur();
                              }
                            }}
                            className={cn(
                              "h-9 rounded-none border-0 focus-visible:ring-2 focus-visible:ring-primary",
                              cellError && "ring-2 ring-destructive"
                            )}
                            placeholder={col.placeholder}
                          />
                        ) : (
                          <div 
                            className={cn(
                              "px-3 py-2 min-h-[36px] cursor-text hover:bg-muted/50 transition-colors whitespace-pre-wrap",
                              !displayValue && "text-muted-foreground italic"
                            )}
                          >
                            {displayValue || col.placeholder || '—'}
                          </div>
                        )}
                        {cellError && (
                          <div className="px-3 py-1 text-xs text-destructive bg-destructive/5">
                            {cellError.message}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                  {canDeleteRows && (
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteRow(rowIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canAddRows && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </Button>
      )}
    </div>
  );
}

import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { InvestLine } from '@/hooks/useServiceProposals';

export interface InvestFormValues {
  invest_lines: InvestLine[];
  show_invest_price: boolean;
  show_offer_amount: boolean;
}

function uid() {
  return Math.random().toString(36).substring(2, 9);
}

function emptyLine(): InvestLine {
  return { id: uid(), designation: '', qty: 1, vun: 0, vtn: 0 };
}

interface ServiceProposalInvestStepProps {
  data: InvestFormValues;
  onChange: (data: InvestFormValues) => void;
}

export function ServiceProposalInvestStep({ data, onChange }: ServiceProposalInvestStepProps) {
  function setLines(lines: InvestLine[]) {
    onChange({ ...data, invest_lines: lines });
  }

  function addLine() {
    setLines([...data.invest_lines, emptyLine()]);
  }

  function updateLine(idx: number, partial: Partial<InvestLine>) {
    const updated = data.invest_lines.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...partial };
      if (partial.qty !== undefined || partial.vun !== undefined) {
        merged.vtn = Math.round(merged.qty * merged.vun * 100) / 100;
      }
      return merged;
    });
    setLines(updated);
  }

  function removeLine(idx: number) {
    setLines(data.invest_lines.filter((_, i) => i !== idx));
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const lines = Array.from(data.invest_lines);
    const [moved] = lines.splice(result.source.index, 1);
    lines.splice(result.destination.index, 0, moved);
    setLines(lines);
  }

  const total = data.invest_lines.reduce((s, l) => s + l.vtn, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matériel</h3>
          <p className="text-sm text-muted-foreground">
            Matériel inclus dans cette proposition de services.
          </p>

        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={addLine} className="gap-1">
            <Plus className="h-4 w-4" />Ajouter
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="hidden sm:grid grid-cols-[auto_1fr_80px_auto] gap-3 px-3 py-2 text-xs text-muted-foreground font-medium border-b bg-muted/30">
          <span />
          <span>Désignation</span>
          <span className="text-center">Nb</span>
          <span />
        </div>

        {data.invest_lines.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Aucune ligne. Cliquez sur « Ajouter » pour commencer.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="invest-lines">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {data.invest_lines.map((line, idx) => (
                    <Draggable key={line.id} draggableId={line.id} index={idx}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(
                            "grid grid-cols-1 sm:grid-cols-[auto_1fr_80px_auto] gap-3 px-3 py-2 items-center border-b last:border-b-0 transition-colors",
                            snapshot.isDragging && "bg-primary/5"
                          )}
                        >
                          <div {...dragProvided.dragHandleProps} className="flex justify-center cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            value={line.designation}
                            onChange={(e) => updateLine(idx, { designation: e.target.value })}
                            placeholder="Désignation du produit"
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            min={1}
                            value={line.qty}
                            onChange={(e) => updateLine(idx, { qty: parseInt(e.target.value) || 1 })}
                            className="h-8 text-sm text-center"
                          />
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors flex justify-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

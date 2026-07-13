import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Download, Loader2 } from 'lucide-react';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { useOptionsAdminStore } from '@/stores/optionsAdminStore';
import { buildPackDescription } from '@/lib/pack-description';

export function ServiceProposalNosOptionsStep() {
  const nosOptions = useServiceProposalStore((s) => s.nosOptions);
  const addNosOption = useServiceProposalStore((s) => s.addNosOption);
  const updateNosOption = useServiceProposalStore((s) => s.updateNosOption);
  const deleteNosOption = useServiceProposalStore((s) => s.deleteNosOption);
  const toggleNosOption = useServiceProposalStore((s) => s.toggleNosOption);

  const { options: adminOptions, ensureLoaded } = useOptionsAdminStore();
  const activeAdminOptions = adminOptions.filter((opt) => opt.isActive);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedAdminOptions, setSelectedAdminOptions] = useState<string[]>([]);

  useEffect(() => {
    setIsLoadingOptions(true);
    ensureLoaded().finally(() => setIsLoadingOptions(false));
  }, [ensureLoaded]);

  const toggleAdminOption = (optionId: string) => {
    setSelectedAdminOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    );
  };

  const handleImportSelected = () => {
    selectedAdminOptions.forEach((optionId) => {
      const option = activeAdminOptions.find((opt) => opt.id === optionId);
      if (!option) return;

      if (option.kind === 'pack') {
        // Compose la description à partir des services regroupés dans le pack.
        const description = buildPackDescription(option, activeAdminOptions);
        addNosOption(option.title, description, option.price?.amount ?? null, option.id);
        return;
      }

      const descriptionParts = option.services.map((s) => {
        const text = typeof s === 'string' ? s : s.text;
        const subItems = typeof s === 'string' ? [] : s.subItems || [];
        if (subItems.length > 0) {
          return `${text}\n  - ${subItems.join('\n  - ')}`;
        }
        return text;
      });
      const description = descriptionParts.join('\n');
      addNosOption(option.title, description, option.price?.amount ?? null);
    });
    setSelectedAdminOptions([]);
    setIsPopoverOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Options disponibles</CardTitle>
          <CardDescription>
            Options sélectionnables affichées dans la proposition Services
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoadingOptions || activeAdminOptions.length === 0}
              >
                {isLoadingOptions ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importer depuis Admin
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="font-medium text-sm">Options disponibles</div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {activeAdminOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAdminOptions.includes(option.id)}
                        onCheckedChange={() => toggleAdminOption(option.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{option.title}</div>
                        {option.price && (
                          <div className="text-xs text-muted-foreground">
                            {option.price.amount} {option.price.unit}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={selectedAdminOptions.length === 0}
                  onClick={handleImportSelected}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter{' '}
                  {selectedAdminOptions.length > 0 && `(${selectedAdminOptions.length})`}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => addNosOption('', '', null)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nosOptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune option</p>
          ) : (
            nosOptions.map((opt) => (
              <div key={opt.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Switch
                  checked={opt.selected}
                  onCheckedChange={() => toggleNosOption(opt.id)}
                  className="mt-2"
                />
                <Input
                  placeholder="Nom"
                  value={opt.name}
                  onChange={(e) => updateNosOption(opt.id, { name: e.target.value })}
                  className="w-40"
                />
                <AutoResizeTextarea
                  placeholder="Description"
                  value={opt.description}
                  onChange={(e) => updateNosOption(opt.id, { description: e.target.value })}
                  className="flex-1 text-sm"
                />
                <div className="flex flex-col gap-1.5 min-w-[160px]">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Prix"
                      value={opt.price ?? ''}
                      onChange={(e) =>
                        updateNosOption(opt.id, {
                          price: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-28 text-sm h-8"
                    />
                    <span className="text-xs text-muted-foreground">€ HT</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground">Prix visible :</span>
                    <Switch
                      checked={opt.showPrice ?? true}
                      onCheckedChange={(checked) =>
                        updateNosOption(opt.id, { showPrice: checked })
                      }
                      className="scale-75 origin-left"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNosOption(opt.id)}
                  className="mt-1"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
        {nosOptions.filter((o) => o.selected).length > 0 && (
          <div className="mt-4">
            <Badge variant="secondary">
              {nosOptions.filter((o) => o.selected).length} option(s) sélectionnée(s)
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

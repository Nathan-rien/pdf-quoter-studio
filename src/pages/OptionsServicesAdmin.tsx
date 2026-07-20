import { useState, useEffect } from "react";
import { useOptionsAdminStore, loadOptionsFromDB } from "@/stores/optionsAdminStore";
import { OptionsServiceCard } from "@/components/options-admin/OptionsServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Settings, Cloud, CloudOff, Loader2, Check } from "lucide-react";

type KindFilter = 'all' | 'option' | 'pack';

export default function OptionsServicesAdmin() {
  const { options, addOption, setOptions, syncStatus } = useOptionsAdminStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(true);

  // Chargement initial depuis la base de données
  useEffect(() => {
    let cancelled = false;
    setIsLoadingFromDB(true);
    loadOptionsFromDB().then((dbOptions) => {
      if (cancelled) return;
      if (dbOptions && dbOptions.length > 0) {
        setOptions(dbOptions);
      }
      setIsLoadingFromDB(false);
    });
    return () => { cancelled = true; };
  }, [setOptions]);

  const filteredOptions = options.filter((opt) => {
    const matchesSearch =
      opt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.services.some((s) =>
        (typeof s === 'string' ? s : s.text).toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesKind = kindFilter === 'all' || opt.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const handleAddNewOption = () => {
    addOption({
      title: "Nouvelle option",
      services: [{ text: "Service à définir" }],
      isActive: true,
      kind: 'option',
    });
  };

  const handleAddNewPack = () => {
    addOption({
      title: "Nouveau pack",
      services: [],
      isActive: true,
      kind: 'pack',
      packServiceIds: [],
    });
  };

  const activeCount = options.filter((o) => o.isActive).length;

  const SyncIndicator = () => {
    if (isLoadingFromDB) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Chargement...</span>
        </div>
      );
    }
    if (syncStatus === 'saving') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Sauvegarde...</span>
        </div>
      );
    }
    if (syncStatus === 'saved') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-success">
          <Check className="h-3 w-3" />
          <span>Sauvegardé</span>
        </div>
      );
    }
    if (syncStatus === 'error') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <CloudOff className="h-3 w-3" />
          <span>Erreur de sync</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Cloud className="h-3 w-3" />
        <span>Synchronisé</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Gestion des Options Services</h2>
              <p className="text-muted-foreground text-xs">
                Options de service disponibles pour vos devis (page 6 du PDF).
              </p>
            </div>
          </div>
          <SyncIndicator />
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="py-2 px-3">
            <CardDescription className="text-xs">Total options</CardDescription>
            <CardTitle className="text-xl">{options.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-2 px-3">
            <CardDescription className="text-xs">Options actives</CardDescription>
            <CardTitle className="text-xl text-success">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-2 px-3">
            <CardDescription className="text-xs">Options avec prix</CardDescription>
            <CardTitle className="text-xl">{options.filter((o) => o.price).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <Button onClick={handleAddNewOption} className="gap-2" size="sm" disabled={isLoadingFromDB}>
          <Plus className="h-3.5 w-3.5" />
          Nouvelle option
        </Button>
        <Button onClick={handleAddNewPack} className="gap-2" size="sm" variant="outline" disabled={isLoadingFromDB}>
          <Plus className="h-3.5 w-3.5" />
          Nouveau pack
        </Button>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-56 h-8 text-sm"
          />
        </div>
      </div>

      {/* Options list */}
      <div className="space-y-2">
        {isLoadingFromDB ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Chargement des options...</p>
            </CardContent>
          </Card>
        ) : filteredOptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Aucune option ne correspond à votre recherche."
                  : "Aucune option définie. Cliquez sur \"Nouvelle option\" pour en créer une."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOptions.map((option) => (
            <OptionsServiceCard key={option.id} option={option} />
          ))
        )}
      </div>
    </div>
  );
}

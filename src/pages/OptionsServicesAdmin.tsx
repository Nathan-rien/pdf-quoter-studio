import { useState } from "react";
import { useOptionsAdminStore } from "@/stores/optionsAdminStore";
import { OptionsServiceCard } from "@/components/options-admin/OptionsServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Settings } from "lucide-react";

export default function OptionsServicesAdmin() {
  const { options, addOption } = useOptionsAdminStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.services.some((s) => 
      (typeof s === 'string' ? s : s.text).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleAddNewOption = () => {
    addOption({
      title: "Nouvelle option",
      services: [{ text: "Service à définir" }],
      isActive: true,
    });
  };

  const activeCount = options.filter((o) => o.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Gestion des Options Services</h2>
            <p className="text-muted-foreground text-sm">
              Définissez les options de service disponibles pour vos devis. Ces options seront affichées sur la page 6 du PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardDescription>Total options</CardDescription>
            <CardTitle className="text-2xl">{options.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardDescription>Options actives</CardDescription>
            <CardTitle className="text-2xl text-success">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardDescription>Options avec prix</CardDescription>
            <CardTitle className="text-2xl">{options.filter((o) => o.price).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-4">
        <Button onClick={handleAddNewOption} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle option
        </Button>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      {/* Options list */}
      <div className="space-y-3">
        {filteredOptions.length === 0 ? (
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

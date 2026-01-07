/**
 * Composant de sélection d'icônes depuis la bibliothèque Lucide
 * Plus de 1400 icônes disponibles avec recherche et catégories
 */

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Catégories d'icônes pour faciliter la navigation
const ICON_CATEGORIES: Record<string, string[]> = {
  'Flèches': [
    'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
    'arrow-up-right', 'arrow-up-left', 'arrow-down-right', 'arrow-down-left',
    'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
    'chevrons-up', 'chevrons-down', 'chevrons-left', 'chevrons-right',
    'move-up', 'move-down', 'move-left', 'move-right',
    'corner-up-left', 'corner-up-right', 'corner-down-left', 'corner-down-right',
    'undo', 'redo', 'undo-2', 'redo-2',
    'arrow-big-up', 'arrow-big-down', 'arrow-big-left', 'arrow-big-right',
  ],
  'Communication': [
    'mail', 'mail-open', 'inbox', 'send', 'forward',
    'phone', 'phone-call', 'phone-incoming', 'phone-outgoing', 'phone-missed',
    'message-circle', 'message-square', 'messages-square',
    'at-sign', 'bell', 'bell-ring', 'megaphone',
    'share', 'share-2', 'external-link', 'link', 'link-2',
    'radio', 'wifi', 'bluetooth', 'signal',
  ],
  'Fichiers': [
    'file', 'file-text', 'file-image', 'file-video', 'file-audio',
    'file-code', 'file-json', 'file-spreadsheet',
    'folder', 'folder-open', 'folder-plus', 'folder-minus',
    'clipboard', 'clipboard-list', 'clipboard-check',
    'download', 'upload', 'hard-drive', 'database',
    'archive', 'zip', 'package',
  ],
  'Média': [
    'image', 'images', 'camera', 'video', 'film',
    'play', 'pause', 'stop', 'skip-back', 'skip-forward',
    'volume', 'volume-1', 'volume-2', 'volume-x',
    'mic', 'mic-off', 'headphones', 'speaker',
    'music', 'music-2', 'music-3', 'music-4',
    'youtube', 'twitch',
  ],
  'Interface': [
    'menu', 'more-horizontal', 'more-vertical', 'grip-horizontal', 'grip-vertical',
    'settings', 'settings-2', 'sliders', 'sliders-horizontal',
    'search', 'filter', 'sort-asc', 'sort-desc',
    'eye', 'eye-off', 'expand', 'minimize', 'maximize',
    'plus', 'minus', 'x', 'check', 'check-circle',
    'info', 'alert-circle', 'alert-triangle', 'help-circle',
    'loader', 'loader-2', 'refresh-cw', 'rotate-cw',
  ],
  'Utilisateurs': [
    'user', 'users', 'user-plus', 'user-minus', 'user-check', 'user-x',
    'contact', 'contact-2', 'badge-check', 'verified',
    'smile', 'frown', 'meh', 'laugh', 'angry',
    'heart', 'heart-handshake', 'thumbs-up', 'thumbs-down',
    'hand-metal', 'hand-shake',
  ],
  'Commerce': [
    'shopping-cart', 'shopping-bag', 'package', 'box',
    'credit-card', 'wallet', 'banknote', 'coins',
    'percent', 'tag', 'tags', 'receipt', 'barcode',
    'store', 'building', 'building-2', 'factory',
    'truck', 'shipping', 'package-check', 'package-x',
  ],
  'Édition': [
    'edit', 'edit-2', 'edit-3', 'pencil', 'pen-tool',
    'eraser', 'scissors', 'crop', 'type',
    'bold', 'italic', 'underline', 'strikethrough',
    'align-left', 'align-center', 'align-right', 'align-justify',
    'list', 'list-ordered', 'list-checks',
    'indent', 'outdent',
    'copy', 'clipboard-copy', 'clipboard-paste',
  ],
  'Formes': [
    'square', 'rectangle', 'circle', 'triangle',
    'pentagon', 'hexagon', 'octagon', 'star',
    'diamond', 'heart', 'spade', 'club',
    'box', 'cube', 'cylinder', 'cone', 'torus',
  ],
  'Météo': [
    'sun', 'moon', 'cloud', 'cloud-sun', 'cloud-moon',
    'cloud-rain', 'cloud-snow', 'cloud-lightning', 'cloud-fog',
    'wind', 'droplets', 'thermometer', 'umbrella',
    'sunrise', 'sunset', 'rainbow',
  ],
  'Transport': [
    'car', 'bus', 'train', 'plane', 'ship', 'rocket',
    'bike', 'sailboat', 'truck', 'tractor',
    'navigation', 'compass', 'map', 'map-pin', 'locate',
    'parking', 'fuel', 'gauge',
  ],
  'Tech': [
    'monitor', 'laptop', 'smartphone', 'tablet', 'watch',
    'cpu', 'hard-drive', 'server', 'database', 'cloud',
    'code', 'terminal', 'git-branch', 'git-commit', 'git-merge',
    'bug', 'zap', 'activity', 'pulse',
    'wifi', 'bluetooth', 'nfc',
  ],
};

// Convertir le nom kebab-case en PascalCase pour accéder aux icônes
const kebabToPascal = (str: string): string => {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

// Obtenir toutes les icônes disponibles
const getAllIconNames = (): string[] => {
  return Object.keys(icons).filter(key => {
    // Filtrer les exports non-icônes
    return typeof (icons as Record<string, unknown>)[key] === 'object' && key !== 'default';
  });
};

// Convertir PascalCase en kebab-case pour l'affichage
const pascalToKebab = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
};

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
  maxHeight?: number;
}

export function IconPicker({ 
  value, 
  onChange, 
  disabled = false,
  maxHeight = 300 
}: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const allIcons = useMemo(() => getAllIconNames(), []);

  // Filtrer les icônes par recherche et catégorie
  const filteredIcons = useMemo(() => {
    let result: string[];

    if (activeTab === 'all') {
      result = allIcons;
    } else {
      const categoryKebabNames = ICON_CATEGORIES[activeTab] || [];
      const categoryPascalNames = categoryKebabNames.map(kebabToPascal);
      result = allIcons.filter(name => categoryPascalNames.includes(name));
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(name => 
        name.toLowerCase().includes(searchLower) ||
        pascalToKebab(name).includes(searchLower)
      );
    }

    // Limiter à 150 icônes pour les performances
    return result.slice(0, 150);
  }, [allIcons, activeTab, search]);

  const handleSelect = useCallback((iconName: string) => {
    if (!disabled) {
      onChange(iconName);
    }
  }, [disabled, onChange]);

  const categoryNames = Object.keys(ICON_CATEGORIES);

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une icône..."
          className="pl-8 pr-8"
          disabled={disabled}
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearch('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Onglets de catégories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-8 w-max">
            <TabsTrigger value="all" className="text-xs px-2 h-6">
              Tous
            </TabsTrigger>
            {categoryNames.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-2 h-6">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value={activeTab} className="mt-2">
          <ScrollArea style={{ height: maxHeight }}>
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 gap-1 p-1">
                {filteredIcons.map(iconName => {
                  const Icon = (icons as Record<string, LucideIcon>)[iconName];
                  if (!Icon) return null;

                  const isSelected = value === iconName;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleSelect(iconName)}
                      disabled={disabled}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-md",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors cursor-pointer",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      title={pascalToKebab(iconName)}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                Aucune icône trouvée
              </div>
            )}
          </ScrollArea>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            {filteredIcons.length} icône{filteredIcons.length > 1 ? 's' : ''} 
            {filteredIcons.length >= 150 && ' (limité à 150)'}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

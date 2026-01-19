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

// Catégories d'icônes avec noms PascalCase (noms réels Lucide)
const ICON_CATEGORIES: Record<string, string[]> = {
  'Flèches': [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'ArrowUpRight', 'ArrowUpLeft', 'ArrowDownRight', 'ArrowDownLeft',
    'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
    'ChevronsUp', 'ChevronsDown', 'ChevronsLeft', 'ChevronsRight',
    'MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight',
    'CornerUpLeft', 'CornerUpRight', 'CornerDownLeft', 'CornerDownRight',
    'Undo', 'Redo', 'Undo2', 'Redo2',
    'ArrowBigUp', 'ArrowBigDown', 'ArrowBigLeft', 'ArrowBigRight',
  ],
  'Communication': [
    'Mail', 'MailOpen', 'Inbox', 'Send', 'Forward',
    'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOutgoing', 'PhoneMissed',
    'MessageCircle', 'MessageSquare', 'MessagesSquare',
    'AtSign', 'Bell', 'BellRing', 'Megaphone',
    'Share', 'Share2', 'ExternalLink', 'Link', 'Link2',
    'Radio', 'Wifi', 'Bluetooth', 'Signal',
  ],
  'Fichiers': [
    'File', 'FileText', 'FileImage', 'FileVideo', 'FileAudio',
    'FileCode', 'FileJson', 'FileSpreadsheet',
    'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus',
    'Clipboard', 'ClipboardList', 'ClipboardCheck',
    'Download', 'Upload', 'HardDrive', 'Database',
    'Archive', 'Package',
  ],
  'Média': [
    'Image', 'Images', 'Camera', 'Video', 'Film',
    'Play', 'Pause', 'Square', 'SkipBack', 'SkipForward',
    'Volume', 'Volume1', 'Volume2', 'VolumeX',
    'Mic', 'MicOff', 'Headphones', 'Speaker',
    'Music', 'Music2', 'Music3', 'Music4',
    'Youtube',
  ],
  'Interface': [
    'Menu', 'MoreHorizontal', 'MoreVertical', 'GripHorizontal', 'GripVertical',
    'Settings', 'Settings2', 'SlidersHorizontal', 'SlidersVertical',
    'Search', 'Filter', 'ArrowUpDown', 'ListFilter',
    'Eye', 'EyeOff', 'Expand', 'Minimize', 'Maximize',
    'Plus', 'Minus', 'X', 'Check', 'CheckCircle',
    'Info', 'AlertCircle', 'AlertTriangle', 'HelpCircle',
    'Loader', 'Loader2', 'RefreshCw', 'RotateCw',
  ],
  'Utilisateurs': [
    'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX',
    'Contact', 'Contact2', 'BadgeCheck',
    'Smile', 'Frown', 'Meh', 'Laugh', 'Angry',
    'Heart', 'HeartHandshake', 'ThumbsUp', 'ThumbsDown',
  ],
  'Commerce': [
    'ShoppingCart', 'ShoppingBag', 'Package', 'Box',
    'CreditCard', 'Wallet', 'Banknote', 'Coins',
    'Percent', 'Tag', 'Tags', 'Receipt', 'Barcode',
    'Store', 'Building', 'Building2', 'Factory',
    'Truck', 'PackageCheck', 'PackageX',
  ],
  'Édition': [
    'Pencil', 'PenTool', 'Highlighter',
    'Eraser', 'Scissors', 'Crop', 'Type',
    'Bold', 'Italic', 'Underline', 'Strikethrough',
    'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify',
    'List', 'ListOrdered', 'ListChecks',
    'IndentIncrease', 'IndentDecrease',
    'Copy', 'ClipboardCopy', 'ClipboardPaste',
  ],
  'Formes': [
    'Square', 'RectangleHorizontal', 'Circle', 'Triangle',
    'Pentagon', 'Hexagon', 'Octagon', 'Star',
    'Diamond', 'Heart', 'Spade', 'Club',
    'Box', 'Cuboid', 'Cylinder', 'Cone',
  ],
  'Météo': [
    'Sun', 'Moon', 'Cloud', 'CloudSun', 'CloudMoon',
    'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudFog',
    'Wind', 'Droplets', 'Thermometer', 'Umbrella',
    'Sunrise', 'Sunset', 'Rainbow',
  ],
  'Transport': [
    'Car', 'Bus', 'Train', 'Plane', 'Ship', 'Rocket',
    'Bike', 'Sailboat', 'Truck', 'Tractor',
    'Navigation', 'Compass', 'Map', 'MapPin', 'LocateFixed',
    'ParkingSquare', 'Fuel', 'Gauge',
  ],
  'Tech': [
    'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Watch',
    'Cpu', 'HardDrive', 'Server', 'Database', 'Cloud',
    'Code', 'Terminal', 'GitBranch', 'GitCommit', 'GitMerge',
    'Bug', 'Zap', 'Activity',
    'Wifi', 'Bluetooth', 'Nfc',
  ],
};

// Obtenir toutes les icônes disponibles (noms PascalCase)
const getAllIconNames = (): string[] => {
  return Object.keys(icons).filter(key => {
    const icon = (icons as Record<string, unknown>)[key];
    // Filtrer uniquement les composants icônes valides
    return icon && typeof icon === 'object' && '$$typeof' in (icon as object);
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
      const categoryNames = ICON_CATEGORIES[activeTab] || [];
      // Filtrer uniquement les icônes qui existent réellement dans Lucide
      result = categoryNames.filter(name => allIcons.includes(name));
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
              <div className="grid grid-cols-6 gap-2 p-2">
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
                        "flex items-center justify-center p-3 rounded-md aspect-square",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors cursor-pointer",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      title={pascalToKebab(iconName)}
                    >
                      <Icon className="h-6 w-6" />
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

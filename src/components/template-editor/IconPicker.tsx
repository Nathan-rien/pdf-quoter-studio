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
    'ArrowUpFromLine', 'ArrowDownFromLine', 'ArrowLeftFromLine', 'ArrowRightFromLine',
    'CircleArrowUp', 'CircleArrowDown', 'CircleArrowLeft', 'CircleArrowRight',
  ],
  'Communication': [
    'Mail', 'MailOpen', 'MailPlus', 'MailCheck', 'MailX', 'Inbox', 'Send', 'Forward', 'Reply', 'ReplyAll',
    'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOutgoing', 'PhoneMissed', 'PhoneOff',
    'MessageCircle', 'MessageSquare', 'MessagesSquare', 'MessageCirclePlus',
    'AtSign', 'Bell', 'BellRing', 'BellOff', 'BellPlus', 'Megaphone',
    'Share', 'Share2', 'ExternalLink', 'Link', 'Link2', 'Unlink',
    'Radio', 'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Signal', 'SignalHigh', 'SignalLow',
    'Rss', 'Podcast', 'Cast', 'Airplay', 'ScreenShare', 'ScreenShareOff',
  ],
  'Fichiers': [
    'File', 'FileText', 'FileImage', 'FileVideo', 'FileAudio', 'FilePlus', 'FileMinus', 'FileX',
    'FileCode', 'FileJson', 'FileSpreadsheet', 'FileArchive', 'FileLock', 'FileSearch',
    'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderX', 'FolderCheck',
    'Clipboard', 'ClipboardList', 'ClipboardCheck', 'ClipboardCopy', 'ClipboardPaste',
    'Download', 'Upload', 'HardDrive', 'Database', 'Server',
    'Archive', 'Package', 'PackageOpen', 'PackageCheck', 'PackageX',
  ],
  'Média': [
    'Image', 'Images', 'ImagePlus', 'ImageOff', 'Camera', 'CameraOff', 'Video', 'VideoOff', 'Film',
    'Play', 'Pause', 'Square', 'SkipBack', 'SkipForward', 'Rewind', 'FastForward',
    'Volume', 'Volume1', 'Volume2', 'VolumeX', 'VolumeOff',
    'Mic', 'MicOff', 'Mic2', 'Headphones', 'Speaker', 'Radio',
    'Music', 'Music2', 'Music3', 'Music4', 'ListMusic',
    'Youtube', 'Twitch', 'Instagram', 'Twitter', 'Facebook', 'Linkedin', 'Github',
  ],
  'Interface': [
    'Menu', 'MoreHorizontal', 'MoreVertical', 'GripHorizontal', 'GripVertical', 'Grip',
    'Settings', 'Settings2', 'SlidersHorizontal', 'SlidersVertical', 'Wrench',
    'Search', 'SearchX', 'Filter', 'FilterX', 'ArrowUpDown', 'ListFilter',
    'Eye', 'EyeOff', 'Expand', 'Minimize', 'Minimize2', 'Maximize', 'Maximize2',
    'Plus', 'Minus', 'X', 'Check', 'CheckCircle', 'CheckCircle2', 'XCircle',
    'Info', 'AlertCircle', 'AlertTriangle', 'HelpCircle', 'CircleHelp',
    'Loader', 'Loader2', 'RefreshCw', 'RefreshCcw', 'RotateCw', 'RotateCcw',
    'Sparkles', 'Zap', 'ZapOff', 'Flame', 'Command', 'Option',
    'Focus', 'Layers', 'Layers2', 'Layers3', 'LayoutGrid', 'LayoutList', 'LayoutDashboard',
    'Bookmark', 'BookmarkPlus', 'BookmarkMinus', 'BookmarkCheck', 'Star', 'StarOff',
  ],
  'Utilisateurs': [
    'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'UserCog',
    'UserCircle', 'UserCircle2', 'UserSquare', 'UserSquare2',
    'Contact', 'Contact2', 'BadgeCheck', 'BadgeX', 'BadgeAlert', 'BadgeInfo',
    'Smile', 'Frown', 'Meh', 'Laugh', 'Angry', 'Annoyed',
    'Heart', 'HeartHandshake', 'HeartCrack', 'HeartOff',
    'ThumbsUp', 'ThumbsDown', 'HandMetal', 'Hand',
  ],
  'Commerce': [
    'ShoppingCart', 'ShoppingBag', 'Package', 'Box', 'Boxes', 'Gift', 'GiftCard',
    'CreditCard', 'Wallet', 'Wallet2', 'Banknote', 'Coins', 'CircleDollarSign',
    'Percent', 'Tag', 'Tags', 'Receipt', 'ReceiptText', 'Barcode', 'QrCode', 'ScanBarcode',
    'Store', 'Storefront', 'Building', 'Building2', 'Factory',
    'Truck', 'PackageCheck', 'PackageX', 'PackagePlus', 'PackageMinus',
    'ShoppingBasket', 'Gem', 'Crown', 'BadgePercent', 'HandCoins', 'Ticket',
  ],
  'Édition': [
    'Pencil', 'PenTool', 'Pen', 'PenLine', 'Highlighter', 'Paintbrush', 'Palette',
    'Eraser', 'Scissors', 'Crop', 'Type', 'CaseSensitive', 'CaseUpper', 'CaseLower',
    'Bold', 'Italic', 'Underline', 'Strikethrough', 'Subscript', 'Superscript',
    'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify',
    'List', 'ListOrdered', 'ListChecks', 'ListTodo', 'ListTree',
    'IndentIncrease', 'IndentDecrease', 'WrapText', 'Pilcrow',
    'Copy', 'ClipboardCopy', 'ClipboardPaste', 'Clipboard', 'ClipboardList',
  ],
  'Formes': [
    'Square', 'RectangleHorizontal', 'RectangleVertical', 'Circle', 'CircleDot', 'Triangle',
    'Pentagon', 'Hexagon', 'Octagon', 'Star', 'Sparkle', 'Sparkles',
    'Diamond', 'Heart', 'Spade', 'Club',
    'Box', 'Cuboid', 'Cylinder', 'Cone', 'Pyramid',
    'Shapes', 'Component', 'Puzzle', 'PuzzlePiece',
  ],
  'Météo': [
    'Sun', 'SunDim', 'SunMedium', 'Moon', 'MoonStar', 'Cloud', 'CloudSun', 'CloudMoon',
    'CloudRain', 'CloudDrizzle', 'CloudSnow', 'CloudHail', 'CloudLightning', 'CloudFog',
    'Wind', 'Droplets', 'Droplet', 'Thermometer', 'ThermometerSun', 'ThermometerSnowflake',
    'Umbrella', 'UmbrellaOff', 'Sunrise', 'Sunset', 'Rainbow', 'Snowflake',
  ],
  'Transport': [
    'Car', 'CarFront', 'Bus', 'Train', 'TramFront', 'Plane', 'PlaneTakeoff', 'PlaneLanding',
    'Ship', 'Sailboat', 'Rocket', 'Bike', 'Truck', 'Tractor', 'Ambulance',
    'Navigation', 'Navigation2', 'Compass', 'Map', 'MapPin', 'MapPinned', 'LocateFixed', 'Locate',
    'ParkingSquare', 'ParkingCircle', 'Fuel', 'Gauge', 'CircleGauge',
    'TrafficCone', 'Milestone', 'Signpost', 'Route',
  ],
  'Tech': [
    'Monitor', 'Laptop', 'Laptop2', 'Smartphone', 'Tablet', 'TabletSmartphone', 'Watch',
    'Cpu', 'CircuitBoard', 'HardDrive', 'Server', 'Database', 'Cloud', 'CloudCog',
    'Code', 'Code2', 'CodeXml', 'Terminal', 'TerminalSquare', 'Braces', 'Binary',
    'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest', 'GitFork',
    'Bug', 'BugOff', 'Zap', 'Activity', 'Gauge',
    'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Nfc', 'Usb',
    'Globe', 'Globe2', 'Network', 'Router', 'Satellite', 'SatelliteDish',
    'Keyboard', 'Mouse', 'MousePointer', 'Gamepad', 'Gamepad2', 'Joystick',
  ],
  'Santé': [
    'Stethoscope', 'Heart', 'HeartPulse', 'Activity', 'Pill', 'Syringe', 'Tablets',
    'Hospital', 'Cross', 'Ambulance', 'Thermometer', 'ThermometerSun',
    'Brain', 'Eye', 'EyeOff', 'Ear', 'EarOff', 'Hand', 'Bone', 'Dna',
    'Apple', 'Salad', 'Droplet', 'Droplets', 'Shield', 'ShieldCheck', 'ShieldPlus',
    'Accessibility', 'Wheelchair', 'Baby', 'PersonStanding', 'Footprints',
  ],
  'Nature': [
    'Leaf', 'Clover', 'TreeDeciduous', 'TreePine', 'Trees', 'Flower', 'Flower2',
    'Sun', 'Moon', 'CloudSun', 'Mountain', 'MountainSnow', 'Waves', 'Palmtree',
    'Wind', 'Droplets', 'Snowflake', 'Flame', 'Zap', 'Rainbow', 'Sunrise', 'Sunset',
    'Bird', 'Bug', 'Fish', 'Rabbit', 'Dog', 'Cat', 'Turtle', 'Squirrel',
    'Sprout', 'Vegan', 'Wheat', 'Grape', 'Cherry', 'Citrus',
  ],
  'Finance': [
    'PiggyBank', 'Wallet', 'Wallet2', 'CreditCard', 'Banknote', 'Coins', 'HandCoins',
    'TrendingUp', 'TrendingDown', 'LineChart', 'BarChart', 'BarChart2', 'BarChart3', 'BarChart4',
    'PieChart', 'AreaChart', 'Calculator', 'Receipt', 'ReceiptText', 'CircleDollarSign',
    'Euro', 'DollarSign', 'PoundSterling', 'Bitcoin', 'Landmark', 'Scale', 'ScaleIcon',
    'ArrowUpRight', 'ArrowDownRight', 'Percent', 'BadgePercent',
  ],
  'Alimentation': [
    'Coffee', 'CupSoda', 'GlassWater', 'Milk', 'UtensilsCrossed', 'Utensils', 'ChefHat', 'Pizza',
    'Apple', 'Carrot', 'Cherry', 'Grape', 'Citrus', 'Banana', 'Cake', 'CakeSlice', 'Croissant',
    'Wine', 'Beer', 'Martini', 'IceCream', 'IceCreamCone', 'Sandwich', 'Soup',
    'Egg', 'EggFried', 'Fish', 'Drumstick', 'Beef', 'Cookie', 'Candy', 'Lollipop',
    'Wheat', 'Salad', 'Vegan', 'Popcorn', 'Ham', 'Bacon',
  ],
  'Sport': [
    'Dumbbell', 'Bike', 'PersonStanding', 'Footprints', 'Timer', 'TimerReset', 'Hourglass',
    'Trophy', 'Medal', 'Award', 'Target', 'Goal', 'Flag', 'FlagTriangleRight',
    'Mountain', 'MountainSnow', 'Tent', 'Compass', 'Backpack', 'Map',
    'Dribbble', 'CircleDot', 'Swords', 'Sword', 'Shield', 'ShieldCheck',
    'Heart', 'HeartPulse', 'Activity', 'Gauge', 'Zap', 'Flame',
  ],
  'Éducation': [
    'GraduationCap', 'BookOpen', 'BookOpenCheck', 'Book', 'BookCopy', 'BookMarked', 'Library',
    'School', 'School2', 'University', 'Pencil', 'PenTool', 'Pen', 'Highlighter', 'Ruler',
    'Lightbulb', 'LightbulbOff', 'Brain', 'BrainCircuit', 'Puzzle', 'PuzzlePiece',
    'FlaskConical', 'FlaskRound', 'TestTube', 'TestTubes', 'TestTube2',
    'Microscope', 'Telescope', 'Globe', 'Globe2', 'Languages', 'Award', 'Medal',
    'Calculator', 'Sigma', 'Pi', 'Percent', 'Divide', 'PlusCircle', 'MinusCircle',
  ],
  'Juridique': [
    'Scale', 'Gavel', 'Shield', 'ShieldCheck', 'ShieldAlert', 'ShieldX', 'ShieldQuestion',
    'Lock', 'LockKeyhole', 'LockOpen', 'Unlock', 'Key', 'KeyRound', 'KeySquare',
    'Fingerprint', 'Scan', 'ScanFace', 'ScanEye',
    'FileCheck', 'FileCheck2', 'FileLock', 'FileLock2', 'FileSignature', 'FileWarning',
    'ClipboardCheck', 'ClipboardList', 'BadgeCheck', 'BadgeAlert', 'Stamp',
    'ScrollText', 'Scroll', 'BookOpen', 'Landmark', 'Building', 'Building2',
  ],
  'Immobilier': [
    'Home', 'House', 'HousePlus', 'Building', 'Building2', 'Buildings',
    'Landmark', 'LandPlot', 'Hotel', 'School', 'Factory', 'Warehouse', 'Store',
    'DoorOpen', 'DoorClosed', 'Key', 'KeyRound', 'Lock', 'Unlock',
    'Bed', 'BedDouble', 'BedSingle', 'Bath', 'Shower', 'Sofa', 'Lamp', 'LampDesk',
    'Fence', 'TreeDeciduous', 'Trees', 'ParkingSquare', 'Garage', 'Construction', 'HardHat',
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

    // Tri alphabétique
    result.sort((a, b) => a.localeCompare(b));

    // Limiter à 250 icônes pour les performances
    return result.slice(0, 250);
  }, [allIcons, activeTab, search]);

  // Compter les icônes par catégorie
  const getCategoryCount = useCallback((category: string): number => {
    if (category === 'all') return allIcons.length;
    const categoryNames = ICON_CATEGORIES[category] || [];
    return categoryNames.filter(name => allIcons.includes(name)).length;
  }, [allIcons]);

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
              Tous ({getCategoryCount('all')})
            </TabsTrigger>
            {categoryNames.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-2 h-6">
                {cat} ({getCategoryCount(cat)})
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
            {filteredIcons.length >= 250 && ' (limité à 250)'}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

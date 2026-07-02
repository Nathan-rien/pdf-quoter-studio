import { useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COMMERCIAUX, CommercialEntity } from "@/data/commerciaux";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  Building2,
  Package,
  LayoutTemplate,
  Wrench,
  Star,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExportRecord {
  id: string;
  proposal_name: string;
  client_name: string | null;
  commercial_id: string | null;
  commercial_name: string | null;
  montant_investissement: number | null;
  options_count: number;
  created_at: string;
  status: string;
  template_name: string;
  selected_options_names: string[] | null;
  selected_nos_options_names: string[] | null;
}

interface StatisticsDashboardProps {
  onNavigateToHistory?: (ids: string[]) => void;
  proposalTypeFilter?: 'location' | 'service' | 'all';
  hideAdditionalOptions?: boolean;
  embedded?: boolean;
}


const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(220 70% 50%)',
  'hsl(160 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(280 65% 55%)',
  'hsl(0 70% 55%)',
  'hsl(200 75% 50%)',
  'hsl(60 70% 45%)',
];

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// Sub-component: accordion table for service/option proposals
function ServiceDetailTable({
  items,
  expanded,
  onToggle,
  colorSet,
}: {
  items: { name: string; proposals: ExportRecord[] }[];
  expanded: string | null;
  onToggle: (name: string) => void;
  colorSet: string[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80px] text-sm text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {items.map((item, i) => {
        const isOpen = expanded === item.name;
        const hasProposals = item.proposals.length > 0;
        return (
          <div key={item.name}>
            <button
              className={`w-full flex items-center gap-3 py-2.5 px-1 transition-colors text-left ${
                hasProposals ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default opacity-60'
              }`}
              onClick={() => hasProposals && onToggle(item.name)}
            >
              {hasProposals ? (
                isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )
              ) : (
                <span className="h-3.5 w-3.5 shrink-0" />
              )}
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: hasProposals ? colorSet[i % colorSet.length] : 'hsl(var(--muted-foreground))' }} />
              <span className="text-sm flex-1 truncate">{item.name}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  hasProposals ? '' : 'bg-muted text-muted-foreground'
                }`}
                style={hasProposals ? {
                  background: colorSet[i % colorSet.length] + '22',
                  color: colorSet[i % colorSet.length],
                } : undefined}
              >
                {item.proposals.length} prop.
              </span>
            </button>
            {isOpen && hasProposals && (
              <div className="pl-8 pb-2 space-y-1">
                {item.proposals.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                    <span className="text-foreground font-medium truncate max-w-[140px]">{p.proposal_name}</span>
                    {p.client_name && (
                      <>
                        <span className="text-border">|</span>
                        <span className="truncate max-w-[120px]">{p.client_name}</span>
                      </>
                    )}
                    <span className="text-border">|</span>
                    <span className="shrink-0">
                      {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StatisticsDashboard({ onNavigateToHistory, proposalTypeFilter = 'all', hideAdditionalOptions = false, embedded = false }: StatisticsDashboardProps) {
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [allServiceOptions, setAllServiceOptions] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [expandedNosOption, setExpandedNosOption] = useState<string | null>(null);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [filterEntity, setFilterEntity] = useState<CommercialEntity | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let exportQuery = supabase
        .from('proposal_exports')
        .select('id, proposal_name, client_name, commercial_id, commercial_name, montant_investissement, options_count, created_at, status, template_name, selected_options_names, selected_nos_options_names, proposal_type')
        .eq('status', 'success')
        .neq('created_by', '89def31b-d1c9-41a8-88f0-6a7d3afbf4c9')
        .order('created_at', { ascending: true });
      if (proposalTypeFilter !== 'all') {
        exportQuery = exportQuery.eq('proposal_type', proposalTypeFilter);
      }
      const [exportRes, optionsRes, settingsRes] = await Promise.all([
        exportQuery,
        supabase
          .from('options_services')
          .select('id, title, is_active')
          .order('sort_order', { ascending: true }),
        supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'stats_reset_date')
          .single(),
      ]);


      if (exportRes.error) throw exportRes.error;
      setRecords((exportRes.data as any) || []);
      setAllServiceOptions((optionsRes.data || []).map(o => ({ id: o.id, title: o.title })));
      
      if (settingsRes.data?.value) {
        setResetDate(new Date(settingsRes.data.value));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalTypeFilter]);


  const handleReset = async () => {
    setIsResetting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'stats_reset_date', value: now, updated_at: now } as any);
      
      if (error) throw error;
      
      setResetDate(new Date(now));
      toast({
        title: "Statistiques remises à zéro",
        description: "Les statistiques afficheront uniquement les données à partir de maintenant.",
      });
    } catch (err) {
      console.error('Error resetting stats:', err);
      toast({
        title: "Erreur",
        description: "Impossible de remettre à zéro les statistiques.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Filtrer par date de reset d'abord
  const baseRecords = resetDate
    ? records.filter(r => new Date(r.created_at) >= resetDate)
    : records;

  // Filtrer par année
  const filteredRecords = baseRecords.filter(r => {
    if (filterYear === 'all') return true;
    return new Date(r.created_at).getFullYear() === parseInt(filterYear);
  });

  const availableYears = [...new Set(baseRecords.map(r => new Date(r.created_at).getFullYear()))].sort((a, b) => b - a);

  // KPI calculations
  const totalProposals = filteredRecords.length;
  const withAmount = filteredRecords.filter(r => r.montant_investissement !== null);
  const amounts = withAmount.map(r => r.montant_investissement as number);
  const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null;
  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : null;
  const minAmount = amounts.length > 0 ? Math.min(...amounts) : null;

  const now = new Date();
  const thisMonth = filteredRecords.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Propositions par mois
  const byMonth: Record<number, number> = {};
  filteredRecords.forEach(r => {
    const m = new Date(r.created_at).getMonth();
    byMonth[m] = (byMonth[m] || 0) + 1;
  });
  const monthlyData = MONTHS_FR.map((name, i) => ({ name, propositions: byMonth[i] || 0 }));

  // Montant total par mois
  const totalByMonthMap: Record<number, number> = {};
  withAmount.forEach(r => {
    const m = new Date(r.created_at).getMonth();
    totalByMonthMap[m] = (totalByMonthMap[m] || 0) + (r.montant_investissement as number);
  });
  const totalByMonthData = MONTHS_FR.map((name, i) => ({
    name,
    montant: totalByMonthMap[i] ? Math.round(totalByMonthMap[i]) : 0,
  }));

  // Top clients
  const byClient: Record<string, number> = {};
  filteredRecords.forEach(r => {
    const key = r.client_name || 'Non renseigné';
    byClient[key] = (byClient[key] || 0) + 1;
  });
  const topClients = Object.entries(byClient)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Propositions avec/sans options
  const withOptions = filteredRecords.filter(r => (r.options_count ?? 0) > 0).length;
  const withoutOptions = filteredRecords.length - withOptions;
  const withOptionsPie = [
    { name: 'Avec options', count: withOptions },
    { name: 'Sans option', count: withoutOptions },
  ];

  // Template usage
  const byTemplate: Record<string, number> = {};
  filteredRecords.forEach(r => {
    const key = r.template_name || 'Inconnu';
    byTemplate[key] = (byTemplate[key] || 0) + 1;
  });
  const templateUsage = Object.entries(byTemplate)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Répartition par commercial
  const byCommercial: Record<string, number> = {};
  filteredRecords.forEach(r => {
    const key = r.commercial_name || 'Non renseigné';
    byCommercial[key] = (byCommercial[key] || 0) + 1;
  });
  const commercialData = Object.entries(byCommercial)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // === Propositions par jour et par commercial (30 derniers jours actifs) ===
  // Filter by entity for the daily table
  const entityFilteredRecords = filterEntity
    ? filteredRecords.filter(r => {
        if (!r.commercial_id) return false;
        const comm = COMMERCIAUX.find(c => c.id === r.commercial_id);
        return comm?.entity === filterEntity;
      })
    : filteredRecords;

  const dailyCommercialMap: Record<string, Record<string, { count: number; ids: string[] }>> = {};
  entityFilteredRecords.forEach(r => {
    const dayKey = format(new Date(r.created_at), 'yyyy-MM-dd');
    const commercial = r.commercial_name || 'Non renseigné';
    if (!dailyCommercialMap[dayKey]) dailyCommercialMap[dayKey] = {};
    if (!dailyCommercialMap[dayKey][commercial]) dailyCommercialMap[dayKey][commercial] = { count: 0, ids: [] };
    dailyCommercialMap[dayKey][commercial].count += 1;
    dailyCommercialMap[dayKey][commercial].ids.push(r.id);
  });

  const uniqueCommercials = [...new Set(entityFilteredRecords.map(r => r.commercial_name || 'Non renseigné'))];
  
  let sortedDays = Object.keys(dailyCommercialMap).sort().slice(-30);
  
  // Filter by specific date
  if (filterDate) {
    const targetKey = format(filterDate, 'yyyy-MM-dd');
    sortedDays = sortedDays.filter(d => d === targetKey);
  }

  const dailyChartData = sortedDays.map(dayKey => {
    const dayLabel = format(new Date(dayKey), 'dd/MM/yyyy');
    const entry: Record<string, any> = { day: dayLabel, _dayKey: dayKey };
    uniqueCommercials.forEach(c => {
      entry[c] = dailyCommercialMap[dayKey]?.[c]?.count || 0;
      entry[`_ids_${c}`] = dailyCommercialMap[dayKey]?.[c]?.ids || [];
    });
    return entry;
  });

  // Top Services additionnels (options cochées page 5)
  const optionNamesCount: Record<string, number> = {};
  filteredRecords.forEach(r => {
    ((r.selected_options_names as string[]) || []).forEach((name: string) => {
      optionNamesCount[name] = (optionNamesCount[name] || 0) + 1;
    });
  });
  const topAdditionalOptions = Object.entries(optionNamesCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Top Nos Options (options cochées page 6)
  const nosOptionNamesCount: Record<string, number> = {};
  filteredRecords.forEach(r => {
    ((r.selected_nos_options_names as string[]) || []).forEach((name: string) => {
      nosOptionNamesCount[name] = (nosOptionNamesCount[name] || 0) + 1;
    });
  });
  const topNosOptions = Object.entries(nosOptionNamesCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const hasOptionsData = topAdditionalOptions.length > 0 || topNosOptions.length > 0;

  // Detailed maps: all services/options → associated proposals
  const optionProposalsMap: Record<string, ExportRecord[]> = {};
  filteredRecords.forEach(r => {
    ((r.selected_options_names as string[]) || []).forEach((name: string) => {
      if (!optionProposalsMap[name]) optionProposalsMap[name] = [];
      optionProposalsMap[name].push(r);
    });
  });
  const knownNames = new Set(allServiceOptions.map(o => o.title));
  const allOptionsWithProposals = [
    ...allServiceOptions.map(opt => ({
      name: opt.title,
      proposals: optionProposalsMap[opt.title] || [],
    })),
    ...Object.entries(optionProposalsMap)
      .filter(([name]) => !knownNames.has(name))
      .map(([name, proposals]) => ({ name, proposals })),
  ].sort((a, b) => b.proposals.length - a.proposals.length);

  const nosOptionProposalsMap: Record<string, ExportRecord[]> = {};
  filteredRecords.forEach(r => {
    ((r.selected_nos_options_names as string[]) || []).forEach((name: string) => {
      if (!nosOptionProposalsMap[name]) nosOptionProposalsMap[name] = [];
      nosOptionProposalsMap[name].push(r);
    });
  });
  const allNosOptionsWithProposals = [
    ...allServiceOptions.map(opt => ({
      name: opt.title,
      proposals: nosOptionProposalsMap[opt.title] || [],
    })),
    ...Object.entries(nosOptionProposalsMap)
      .filter(([name]) => !knownNames.has(name))
      .map(([name, proposals]) => ({ name, proposals })),
  ].sort((a, b) => b.proposals.length - a.proposals.length);

  const formatAmount = (v: number | null) => {
    if (v === null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  };

  const withAmountPct = totalProposals > 0 ? Math.round((withAmount.length / totalProposals) * 100) : 0;
  const hasAmountData = withAmount.length > 0;

  const KpiCard = ({ title, value, icon: Icon, sub, noData }: { title: string; value: string; icon: any; sub?: string; noData?: boolean }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold ${noData ? 'text-muted-foreground' : ''}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${noData ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!embedded && (
          <div>
            <h2 className="text-lg font-semibold">Statistiques</h2>
            <p className="text-sm text-muted-foreground">Aperçu global des propositions exportées</p>
          </div>
        )}
        {embedded && <div />}

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Remettre à zéro
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remettre à zéro les statistiques ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Les données historiques ne seront pas supprimées. Les statistiques afficheront uniquement les propositions créées à partir de maintenant.
                  {resetDate && (
                    <span className="block mt-2 text-foreground font-medium">
                      Dernière remise à zéro : {resetDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} disabled={isResetting}>
                  {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Badge date de reset */}
      {resetDate && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            Données depuis le {resetDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Badge>
        </div>
      )}

      {/* Bannière info si peu de données avec montants */}
      {!hasAmountData && totalProposals > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground text-xs">
          <Euro className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Les <strong className="text-foreground">{totalProposals} propositions existantes</strong> ont été générées avant l'activation du suivi des montants. 
            Les nouvelles exportations PDF alimenteront automatiquement ces statistiques.
          </p>
        </div>
      )}
      {hasAmountData && withAmountPct < 100 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground text-xs">
          <Euro className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Montants disponibles pour <strong className="text-foreground">{withAmount.length} / {totalProposals} propositions</strong> ({withAmountPct}%). 
            Les anciennes exportations n'ont pas de montant enregistré.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total propositions"
          value={String(totalProposals)}
          icon={FileText}
          sub={`${thisMonth} ce mois-ci`}
        />
        <KpiCard
          title="Montant moyen"
          value={hasAmountData ? formatAmount(avgAmount) : 'N/A'}
          icon={Euro}
          sub={hasAmountData ? `Sur ${withAmount.length} proposition(s) avec montant` : 'Aucun montant enregistré'}
          noData={!hasAmountData}
        />
        <KpiCard
          title="Montant le plus haut"
          value={hasAmountData ? formatAmount(maxAmount) : 'N/A'}
          icon={ArrowUpRight}
          noData={!hasAmountData}
        />
        <KpiCard
          title="Montant le plus bas"
          value={hasAmountData ? formatAmount(minAmount) : 'N/A'}
          icon={ArrowDownRight}
          noData={!hasAmountData}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart propositions par mois */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Propositions par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v: number) => [v, 'Propositions']}
                />
                <Bar dataKey="propositions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart par commercial */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Répartition par commercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commercialData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={commercialData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {commercialData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(v: number, name: string) => [v + ' proposition(s)', name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Montant total investi par mois */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Euro className="h-4 w-4 text-primary" />
            Montant total investi par mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAmountData ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Aucune donnée de montant disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={totalByMonthData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v ? `${(v / 1000).toFixed(0)}k€` : '0'}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v: number) => [formatAmount(v), 'Total investi']}
                />
                <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Propositions par jour et par commercial */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Propositions par jour et par commercial
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs gap-1.5 w-[180px] justify-start",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {filterDate ? format(filterDate, 'dd/MM/yyyy') : "Filtrer par date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {filterDate && (
              <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setFilterDate(undefined)}>
                ✕ Effacer
              </Button>
            )}
            {/* Entity switch */}
            <div className="flex items-center gap-2 ml-auto">
              <span className={cn("text-xs font-medium", filterEntity !== 'grosbill-pro' ? "text-foreground" : "text-muted-foreground")}>Cybertek Pro</span>
              <Switch
                checked={filterEntity === 'grosbill-pro'}
                onCheckedChange={(checked) => {
                  if (checked && filterEntity === 'grosbill-pro') {
                    setFilterEntity(null);
                  } else if (!checked && filterEntity === 'cybertek-pro') {
                    setFilterEntity(null);
                  } else {
                    setFilterEntity(checked ? 'grosbill-pro' : 'cybertek-pro');
                  }
                }}
              />
              <span className={cn("text-xs font-medium", filterEntity === 'grosbill-pro' ? "text-foreground" : "text-muted-foreground")}>Grosbill Pro</span>
            </div>
            {filterEntity && (
              <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setFilterEntity(null)}>
                Tous
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dailyChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Aucune donnée disponible
            </div>
          ) : (
            <ScrollArea className="w-full" type="auto">
              <div className="min-w-[500px]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                      {uniqueCommercials.map((c) => (
                        <th key={c} className="px-3 py-2 text-center font-semibold text-muted-foreground">{c}</th>
                      ))}
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dailyChartData].reverse().map((row, i) => {
                      const total = uniqueCommercials.reduce((sum, c) => sum + ((row[c] as number) || 0), 0);
                      return (
                        <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-1.5 font-medium">{row.day}</td>
                          {uniqueCommercials.map((c) => {
                            const v = (row[c] as number) || 0;
                            const ids = (row[`_ids_${c}`] as string[]) || [];
                            return (
                              <td key={c} className="px-3 py-1.5 text-center">
                                {v > 0 && onNavigateToHistory ? (
                                  <button
                                    className="text-primary font-bold hover:underline cursor-pointer"
                                    onClick={() => onNavigateToHistory(ids)}
                                  >
                                    {v}
                                  </button>
                                ) : (
                                  <span className={v === 0 ? 'text-muted-foreground' : 'font-bold'}>{v}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-1.5 text-center font-bold">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/50 font-semibold">
                      <td className="px-3 py-2">Total</td>
                      {uniqueCommercials.map((c) => {
                        const colTotal = dailyChartData.reduce((sum, row) => sum + ((row[c] as number) || 0), 0);
                        return (
                          <td key={c} className="px-3 py-2 text-center">{colTotal}</td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        {dailyChartData.reduce((sum, row) => sum + uniqueCommercials.reduce((s, c) => s + ((row[c] as number) || 0), 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Top clients + Options pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top clients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Top clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {topClients.map((item, i) => {
                  const pct = Math.round((item.count / (topClients[0]?.count || 1)) * 100);
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm w-36 truncate">{item.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{item.count} prop.</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Propositions avec/sans options */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Propositions avec options
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={160}>
                  <PieChart>
                    <Pie
                      data={withOptionsPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="count"
                      nameKey="name"
                      labelLine={false}
                    >
                      {withOptionsPie.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6 }}
                      formatter={(v: number, name: string) => [v + ' proposition(s)', name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm">
                  {withOptionsPie.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium ml-1">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Options et Services les plus proposés */}
      <div className={hideAdditionalOptions ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
        {!hideAdditionalOptions && (
        <Card>

          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Services additionnels les plus proposés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAdditionalOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[120px] text-sm text-muted-foreground text-center gap-1">
                <Wrench className="h-5 w-5 opacity-30 mb-1" />
                <p>Aucune donnée disponible</p>
                <p className="text-xs">Les nouvelles exportations alimenteront automatiquement ces statistiques.</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {topAdditionalOptions.map((item, i) => {
                  const pct = Math.round((item.count / (topAdditionalOptions[0]?.count || 1)) * 100);
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm flex-1 truncate">{item.name}</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{item.count} prop.</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}



        {/* Nos Options */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Nos Options les plus proposées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topNosOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[120px] text-sm text-muted-foreground text-center gap-1">
                <Star className="h-5 w-5 opacity-30 mb-1" />
                <p>Aucune donnée disponible</p>
                <p className="text-xs">Les nouvelles exportations alimenteront automatiquement ces statistiques.</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {topNosOptions.map((item, i) => {
                  const pct = Math.round((item.count / (topNosOptions[0]?.count || 1)) * 100);
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm flex-1 truncate">{item.name}</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{item.count} prop.</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Listes détaillées Services / Nos Options avec propositions associées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services additionnels — détail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Services additionnels — détail par proposition
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 max-h-[400px] overflow-y-auto">
            <ServiceDetailTable
              items={allOptionsWithProposals}
              expanded={expandedOption}
              onToggle={(name) => setExpandedOption(prev => prev === name ? null : name)}
              colorSet={CHART_COLORS}
            />
          </CardContent>
        </Card>

        {/* Nos Options — détail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Nos Options — détail par proposition
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 max-h-[400px] overflow-y-auto">
            <ServiceDetailTable
              items={allNosOptionsWithProposals}
              expanded={expandedNosOption}
              onToggle={(name) => setExpandedNosOption(prev => prev === name ? null : name)}
              colorSet={CHART_COLORS}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

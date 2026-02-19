import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  FileText,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExportRecord {
  id: string;
  proposal_name: string;
  client_name: string | null;
  commercial_name: string | null;
  montant_investissement: number | null;
  options_count: number;
  created_at: string;
  status: string;
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

export function StatisticsDashboard() {
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('id, proposal_name, client_name, commercial_name, montant_investissement, options_count, created_at, status')
        .eq('status', 'success')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRecords((data as any) || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrer par année
  const filteredRecords = records.filter(r => {
    if (filterYear === 'all') return true;
    return new Date(r.created_at).getFullYear() === parseInt(filterYear);
  });

  const availableYears = [...new Set(records.map(r => new Date(r.created_at).getFullYear()))].sort((a, b) => b - a);

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

  // Montant moyen par mois
  const avgByMonth: Record<number, { sum: number; count: number }> = {};
  withAmount.forEach(r => {
    const m = new Date(r.created_at).getMonth();
    if (!avgByMonth[m]) avgByMonth[m] = { sum: 0, count: 0 };
    avgByMonth[m].sum += r.montant_investissement as number;
    avgByMonth[m].count += 1;
  });
  const avgMonthlyData = MONTHS_FR.map((name, i) => ({
    name,
    montant: avgByMonth[i] ? Math.round(avgByMonth[i].sum / avgByMonth[i].count) : null,
  }));

  // Répartition par commercial
  const byCommercial: Record<string, number> = {};
  filteredRecords.forEach(r => {
    const key = r.commercial_name || 'Non renseigné';
    byCommercial[key] = (byCommercial[key] || 0) + 1;
  });
  const commercialData = Object.entries(byCommercial)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const formatAmount = (v: number | null) => {
    if (v === null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  };

  const KpiCard = ({ title, value, icon: Icon, sub }: { title: string; value: string; icon: any; sub?: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
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
        <div>
          <h2 className="text-lg font-semibold">Statistiques</h2>
          <p className="text-sm text-muted-foreground">Aperçu global des propositions exportées</p>
        </div>
        <div className="flex items-center gap-2">
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
          value={formatAmount(avgAmount)}
          icon={Euro}
          sub="Par proposition"
        />
        <KpiCard
          title="Montant le plus haut"
          value={formatAmount(maxAmount)}
          icon={ArrowUpRight}
        />
        <KpiCard
          title="Montant le plus bas"
          value={formatAmount(minAmount)}
          icon={ArrowDownRight}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart propositions par mois */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
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

      {/* Line chart montant moyen */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Évolution du montant moyen d'investissement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={avgMonthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v ? `${(v / 1000).toFixed(0)}k€` : ''}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                formatter={(v: number) => [formatAmount(v), 'Montant moyen']}
              />
              <Line
                type="monotone"
                dataKey="montant"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tableau des commerciaux */}
      {commercialData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Détail par commercial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commercialData.map((item, i) => {
                const commercialRecords = filteredRecords.filter(r => (r.commercial_name || 'Non renseigné') === item.name);
                const commercialAmounts = commercialRecords.filter(r => r.montant_investissement).map(r => r.montant_investissement as number);
                const avg = commercialAmounts.length > 0 ? commercialAmounts.reduce((a, b) => a + b, 0) / commercialAmounts.length : null;
                const maxPct = Math.round((item.count / totalProposals) * 100);
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm w-40 truncate">{item.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${maxPct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">{item.count} prop.</span>
                    <span className="text-xs font-medium w-28 text-right">{formatAmount(avg)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

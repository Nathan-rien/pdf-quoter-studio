import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useContracts } from '@/hooks/useContracts';
import { useAggregatedContractRents } from '@/lib/contract-rent-aggregation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileText, FileSignature, Euro, Users, Loader2, Wrench } from 'lucide-react';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(30 80% 55%)', 'hsl(160 60% 45%)', 'hsl(280 65% 55%)'];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

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

function formatEuro(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

interface ExportLite {
  id: string;
  created_at: string;
  proposal_type: string;
  montant_investissement: number | null;
  commercial_name: string | null;
}

export function GlobalStatsView() {
  const [records, setRecords] = useState<ExportLite[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: locationContracts = [] } = useContracts('location');
  const { data: serviceContracts = [] } = useContracts('service');
  const allContracts = useMemo(() => [...locationContracts, ...serviceContracts], [locationContracts, serviceContracts]);
  const { data: aggRents } = useAggregatedContractRents(allContracts);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('proposal_exports')
        .select('id, created_at, proposal_type, montant_investissement, commercial_name')
        .eq('status', 'success')
        .neq('created_by', '89def31b-d1c9-41a8-88f0-6a7d3afbf4c9');
      setRecords((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const locProp = records.filter((r) => r.proposal_type === 'location');
    const svcProp = records.filter((r) => r.proposal_type === 'service');
    const totalProp = records.length;

    const investPropSum = records.reduce((s, r) => s + (r.montant_investissement ?? 0), 0);
    const investContractSum = allContracts.reduce((s, c) => s + (Number(c.amount_ht ?? 0) || 0), 0);

    const quarterlySum = aggRents.quarterlySum;

    const totalContracts = allContracts.length;

    const propPie = [
      { name: 'Location', count: locProp.length },
      { name: 'Services', count: svcProp.length },
    ];
    const contractPie = [
      { name: 'Location', count: locationContracts.length },
      { name: 'Services', count: serviceContracts.length },
    ];

    // Stacked monthly proposals
    const byMonth: Record<number, { location: number; services: number }> = {};
    records.forEach((r) => {
      const m = new Date(r.created_at).getMonth();
      if (!byMonth[m]) byMonth[m] = { location: 0, services: 0 };
      if (r.proposal_type === 'service') byMonth[m].services++;
      else byMonth[m].location++;
    });
    const monthlyData = MONTHS_FR.map((name, i) => ({ name, location: byMonth[i]?.location || 0, services: byMonth[i]?.services || 0 }));

    // Top 5 commercials (all)
    const byComm: Record<string, number> = {};
    records.forEach((r) => {
      const k = r.commercial_name || 'Non renseigné';
      byComm[k] = (byComm[k] || 0) + 1;
    });
    const topCommercials = Object.entries(byComm).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    return { totalProp, totalContracts, investPropSum, investContractSum, quarterlySum, propPie, contractPie, monthlyData, topCommercials };
  }, [records, locationContracts, serviceContracts, allContracts, aggRents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Propositions totales" value={String(stats.totalProp)} icon={FileText} sub={`Investissement propositions : ${formatEuro(stats.investPropSum)}`} />
        <KpiCard title="Contrats totaux" value={String(stats.totalContracts)} icon={FileSignature} />
        <KpiCard title="Investissement contrats HT" value={formatEuro(stats.investContractSum)} icon={Euro} />
        <KpiCard title="Loyer trimestriel cumulé HT" value={formatEuro(stats.quarterlySum)} icon={Euro} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Propositions — Location vs Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.propPie} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.propPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" /> Contrats — Location vs Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.contractPie} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.contractPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Volume mensuel des propositions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="location" stackId="a" name="Location" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="services" stackId="a" name="Services" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Top 5 commerciaux (toutes propositions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topCommercials.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">Aucune donnée</div>
          ) : (
            <div className="space-y-2">
              {stats.topCommercials.map((c, i) => {
                const max = stats.topCommercials[0].count || 1;
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm flex-1 truncate">{c.name}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{c.count} prop.</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

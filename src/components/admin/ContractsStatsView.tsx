import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContracts, Contract, ProposalType } from '@/hooks/useContracts';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { useAggregatedContractRents } from '@/lib/contract-rent-aggregation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileSignature, Euro, Users, Building2, Handshake, Loader2, Calendar as CalendarIcon } from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(220 70% 50%)',
  'hsl(160 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(280 65% 55%)',
  'hsl(0 70% 55%)',
];

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const ENSEIGNE_LABELS: Record<string, string> = {
  'cybertek-pro': 'Cybertek Pro',
  'grosbill-pro': 'Grosbill Pro',
  'dental': '3D Dental',
  '3d-dental': '3D Dental',
  '3ddental': '3D Dental',
};

function formatEnseigne(raw: string): string {
  const key = (raw || '').toLowerCase().trim();
  if (ENSEIGNE_LABELS[key]) return ENSEIGNE_LABELS[key];
  if (!raw || raw === 'Non renseigné') return 'Non renseigné';
  return raw;
}


interface Props {
  proposalType: ProposalType;
  hideFinancialPartner?: boolean;
}

function formatEuro(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function contractMonthly(c: Contract): number | null {
  if (c.monthly_rent_ht != null && Number.isFinite(Number(c.monthly_rent_ht))) return Number(c.monthly_rent_ht);
  if (c.quarterly_rent_ht != null && Number.isFinite(Number(c.quarterly_rent_ht))) return Number(c.quarterly_rent_ht) / 3;
  return null;
}
function contractQuarterly(c: Contract): number | null {
  if (c.quarterly_rent_ht != null && Number.isFinite(Number(c.quarterly_rent_ht))) return Number(c.quarterly_rent_ht);
  if (c.monthly_rent_ht != null && Number.isFinite(Number(c.monthly_rent_ht))) return Number(c.monthly_rent_ht) * 3;
  return null;
}

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

export function ContractsStatsView({ proposalType, hideFinancialPartner = false }: Props) {
  const { data: contracts = [], isLoading } = useContracts(proposalType);
  const { getCommercialById } = useCommerciaux();
  const { data: aggRents, isLoading: rentsLoading } = useAggregatedContractRents(contracts);

  const stats = useMemo(() => {
    const total = contracts.length;
    const monthlySum = aggRents.monthlySum;
    const quarterlySum = aggRents.quarterlySum;
    const durations = contracts.map((c) => c.duration_months).filter((d): d is number => typeof d === 'number' && d > 0);
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

    // per month
    const byMonth: Record<number, number> = {};
    contracts.forEach((c) => {
      const m = new Date(c.created_at).getMonth();
      byMonth[m] = (byMonth[m] || 0) + 1;
    });
    const monthlyData = MONTHS_FR.map((name, i) => ({ name, contrats: byMonth[i] || 0 }));

    // by commercial
    const byCommercial: Record<string, number> = {};
    contracts.forEach((c) => {
      const key = c.commercial_name || c.commercial_id || 'Non renseigné';
      byCommercial[key] = (byCommercial[key] || 0) + 1;
    });
    const commercialData = Object.entries(byCommercial).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // by enseigne (commercial.entity)
    const byEnseigne: Record<string, number> = {};
    contracts.forEach((c) => {
      const entity = getCommercialById(c.commercial_id)?.entity ?? 'Non renseigné';
      const label = formatEnseigne(entity);
      byEnseigne[label] = (byEnseigne[label] || 0) + 1;
    });
    const enseigneData = Object.entries(byEnseigne).map(([name, count]) => ({ name, count }));


    // by partner
    const byPartner: Record<string, number> = {};
    contracts.forEach((c) => {
      const key = c.financial_partner || 'Non renseigné';
      byPartner[key] = (byPartner[key] || 0) + 1;
    });
    const partnerData = Object.entries(byPartner).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // frequency
    const freqCount = { mensuel: 0, trimestriel: 0 };
    contracts.forEach((c) => {
      const f = (c.payment_frequency === 'trimestriel') ? 'trimestriel' : 'mensuel';
      freqCount[f]++;
    });
    const freqData = [
      { name: 'Mensuel', count: freqCount.mensuel },
      { name: 'Trimestriel', count: freqCount.trimestriel },
    ];

    // top clients by quarterly
    const clientMap: Record<string, number> = {};
    contracts.forEach((c) => {
      const name = c.client_name || 'Non renseigné';
      const q = aggRents.rents.get(c.id)?.quarterly ?? 0;
      clientMap[name] = (clientMap[name] || 0) + q;
    });
    const topClients = Object.entries(clientMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { total, monthlySum, quarterlySum, avgDuration, monthlyData, commercialData, enseigneData, partnerData, freqData, topClients };
  }, [contracts, getCommercialById, aggRents]);

  if (isLoading || rentsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Contrats" value={String(stats.total)} icon={FileSignature} />
        <KpiCard title="Loyer mensuel cumulé HT" value={formatEuro(stats.monthlySum)} icon={Euro} />
        <KpiCard title="Loyer trimestriel cumulé HT" value={formatEuro(stats.quarterlySum)} icon={Euro} />
        <KpiCard title="Durée moyenne" value={stats.avgDuration != null ? `${stats.avgDuration} mois` : '—'} icon={CalendarIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" /> Contrats créés par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [v, 'Contrats']} />
                <Bar dataKey="contrats" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Répartition par commercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.commercialData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.commercialData} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={`grid grid-cols-1 ${hideFinancialPartner ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Répartition par enseigne
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enseigneData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <Pie
                    data={stats.enseigneData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={70}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.enseigneData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number, n: string) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {!hideFinancialPartner && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Handshake className="h-4 w-4 text-primary" /> Répartition par partenaire financier
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.partnerData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Aucune donnée disponible</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <Pie
                      data={stats.partnerData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={40}
                      outerRadius={70}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.partnerData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" /> Périodicité de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <Pie
                  data={stats.freqData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >

                  {stats.freqData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
            <Building2 className="h-4 w-4 text-primary" /> Top 5 clients par loyer trimestriel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topClients.length === 0 ? (
            <div className="flex items-center justify-center h-[80px] text-sm text-muted-foreground">Aucune donnée</div>
          ) : (
            <div className="space-y-2">
              {stats.topClients.map((c, i) => {
                const max = stats.topClients[0].amount || 1;
                const pct = Math.round((c.amount / max) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm flex-1 truncate">{c.name}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{formatEuro(c.amount)}</span>
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

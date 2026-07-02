import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutDashboard, FileText, Wrench, FileSignature, Handshake } from 'lucide-react';
import { StatisticsDashboard } from './StatisticsDashboard';
import { ContractsStatsView } from './ContractsStatsView';
import { GlobalStatsView } from './GlobalStatsView';

interface Props {
  onNavigateToHistory?: (ids: string[]) => void;
}

export function StatisticsView({ onNavigateToHistory }: Props) {
  const [tab, setTab] = useState<string>('global');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Statistiques</h2>
          <p className="text-sm text-muted-foreground">Vue d'ensemble et analyses par périmètre</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto">
          <TabsTrigger value="global" className="gap-1.5 text-xs md:text-sm">
            <LayoutDashboard className="h-3.5 w-3.5" /> Vue globale
          </TabsTrigger>
          <TabsTrigger value="prop-location" className="gap-1.5 text-xs md:text-sm">
            <FileText className="h-3.5 w-3.5" /> Propositions Location
          </TabsTrigger>
          <TabsTrigger value="prop-services" className="gap-1.5 text-xs md:text-sm">
            <Wrench className="h-3.5 w-3.5" /> Propositions Services
          </TabsTrigger>
          <TabsTrigger value="contracts-location" className="gap-1.5 text-xs md:text-sm">
            <FileSignature className="h-3.5 w-3.5" /> Contrats Location
          </TabsTrigger>
          <TabsTrigger value="contracts-services" className="gap-1.5 text-xs md:text-sm">
            <Handshake className="h-3.5 w-3.5" /> Contrats Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-4">
          <GlobalStatsView />
        </TabsContent>
        <TabsContent value="prop-location" className="mt-4">
          <StatisticsDashboard
            onNavigateToHistory={onNavigateToHistory}
            proposalTypeFilter="location"
            embedded
          />
        </TabsContent>
        <TabsContent value="prop-services" className="mt-4">
          <StatisticsDashboard
            onNavigateToHistory={onNavigateToHistory}
            proposalTypeFilter="service"
            hideAdditionalOptions
            embedded
          />
        </TabsContent>
        <TabsContent value="contracts-location" className="mt-4">
          <ContractsStatsView proposalType="location" />
        </TabsContent>
        <TabsContent value="contracts-services" className="mt-4">
          <ContractsStatsView proposalType="service" hideFinancialPartner />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSaveTransacBrandSettings, useTransacBrandSettings } from '@/hooks/useTransacQuotes';
import { TRANSAC_BRAND_DEFAULTS, type TransacBrand, type TransacBrandSettings as Settings } from '@/lib/transac-brands';

const FIELDS: { key: keyof Settings; label: string; multiline?: boolean }[] = [
  { key: 'phone', label: 'Téléphone' }, { key: 'email', label: 'E-mail' }, { key: 'website', label: 'Site' },
  { key: 'cgvUrl', label: 'Lien CGV' }, { key: 'legalFooter', label: 'Pied de page légal', multiline: true },
  { key: 'conditions', label: 'Conditions (une par ligne)', multiline: true },
];

function BrandCard({ brand, initial }: { brand: TransacBrand; initial: Settings }) {
  const { toast } = useToast();
  const save = useSaveTransacBrandSettings();
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{initial.label}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            {f.multiline
              ? <Textarea rows={f.key === 'conditions' ? 5 : 3} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
              : <Input value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Button size="sm" disabled={save.isPending} onClick={() => save.mutate({ brand, settings: v }, {
            onSuccess: () => toast({ title: 'Mentions enregistrées' }),
            onError: (e) => toast({ title: 'Enregistrement impossible', description: (e as Error).message, variant: 'destructive' }),
          })}>Enregistrer</Button>
          <Button size="sm" variant="outline" onClick={() => setV(TRANSAC_BRAND_DEFAULTS[brand])}>Valeurs par défaut</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransacBrandSettings() {
  const { data } = useTransacBrandSettings();
  if (!data) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BrandCard brand="cybertek-pro" initial={data['cybertek-pro']} />
      <BrandCard brand="grosbill-pro" initial={data['grosbill-pro']} />
    </div>
  );
}
